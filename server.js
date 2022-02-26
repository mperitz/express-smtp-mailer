require('dotenv').config();
const express = require('express');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const emailRoutes = require('./routes/email_router');
const logger = require('./logger');

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 5000;

// Multi-process to utilize all CPU cores.
if (!isDev && cluster.isMaster) {
  logger.logSuccess(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.log(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`);
  });
} else {
  const app = express();

  // apply rate limiter to all requests
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute
    max: 100, // limit to 100 requests per windowMs
  });

  logger.log('Only logging errors');
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400,
  }));
  app.use(apiLimiter);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Answer API requests.
  app.use('/email', emailRoutes);

  // All remaining requests return the frontend app, so it can handle routing.
  app.listen(PORT, () => {
    logger.logSuccess(
      `Node ${
        isDev ? 'dev server' : `cluster worker ${process.pid}`
      }: listening on port ${PORT}`,
    );
  });

  process.on('SIGTERM', () => {
    app.close(() => {
      logger.log('Process terminated');
    });
  });
}
