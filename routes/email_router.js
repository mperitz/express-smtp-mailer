const router = require('express').Router();
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const logger = require('../logger');
const { BodyValidator } = require('../body_validator');

const maybeAddZero = (digit) => (parseInt(digit, 10) < 10 ? `0${digit}` : digit);

const transport = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
};

// call the transport function
const transporter = nodemailer.createTransport(transport);

// eslint-disable-next-line no-unused-vars
transporter.verify((err, _) => {
  if (err) {
    logger.logError(err);
  } else {
    logger.logSuccess('Ready to send mail!');
  }
});

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-reqed-With, Content-Type, Accept',
  );
  next();
});

router.get('/', (req, res) => {
  res.status(200).json({
    errors: [],
  });
});

router.post('/', async (req, res) => {
  const { validated } = new BodyValidator(req.body);
  if (!validated.isValid) {
    return res.status(404).json({
      errors: validated.errors,
    });
  }

  const sendDate = new Date(req.body.date);
  const year = sendDate.getFullYear();
  const month = sendDate.getMonth() + 1;
  const day = sendDate.getDate();
  const hours = sendDate.getHours();

  const minutes = sendDate.getMinutes();
  const seconds = sendDate.getSeconds();
  const dateString = `${month}/${day}/${year} ${maybeAddZero(hours)}:${maybeAddZero(minutes)}:${maybeAddZero(seconds)}`;

  const mailOptions = {
    from: req.body.email, // sender address
    to: [process.env.MAIL_USERNAME], // list of receivers
    replyTo: req.body.email,
    subject: 'Client Message', // Subject line
    text: req.body.message,
    html: `
      <h4>Message received <${dateString}></h4>
      <hr></hr>
      <br></br>
      <ul>
        <li>Name: ${req.body.name}</li>
        <br></br>
        <li>Email: ${req.body.email}</li>
        <br></br>
      </ul>
      <h5>Message Details</h5>
      <hr></hr>
      <br></br>
      ${req.body.message}
    `,
    dsn: {
      id: 'smtp-dsn-report',
      return: 'full',
      notify: ['success', 'failure', 'delay'],
      recipient: process.env.MAIL_USERNAME,
    },
  };

  try {
    res.set('Content-Type', 'application/json');
    await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.logError(error);
    return res.status(500).json({
      errors: [error],
    });
  }

  return res.json({
    status: 200,
    errors: [],
  });
});

module.exports = router;
