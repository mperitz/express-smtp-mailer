/* eslint-disable max-classes-per-file */
// eslint-disable-next-line no-control-regex
const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

const getErrorList = (valid, errorMessage) => (valid ? [] : [errorMessage]);

const isNotBlank = (string) => string && string.length;

class ValidType {
  constructor(type, isValid, errors = []) {
    this.isValid = isValid;
    this.errors = errors;
  }
}

class BodyValidator {
  constructor(body) {
    this.body = body;
  }

  get isValidDate() {
    const type = 'date';
    if (!(typeof this.body.date === 'number')) {
      return new ValidType(type, false, [`Invalid date type passed: ${typeof this.body.date}`]);
    }

    if (this.body.date < 0) {
      return new ValidType(type, false, ['Negative date value sent']);
    }

    if (this.body.date > Date.now()) {
      return new ValidType(type, false, ['Date is in the future']);
    }

    return new ValidType(type, true);
  }

  get isValidEmail() {
    const valid = emailRegex.test(this.body.email);

    return new ValidType('email', valid, getErrorList(valid, 'Email is not properly formatted'));
  }

  get isValidName() {
    const valid = isNotBlank(this.body.name);

    return new ValidType('name', valid, getErrorList(valid, 'Name is null or blank'));
  }

  get isValidMessage() {
    const valid = isNotBlank(this.body.message);

    return new ValidType('message', valid, getErrorList(valid, 'Message is null or blank'));
  }

  get validated() {
    if (!this.body) {
      return new ValidType('body', false, [new ValidType('body', false, ['Body is undefined or null'])]);
    }

    const validTypes = [
      this.isValidDate,
      this.isValidEmail,
      this.isValidName,
      this.isValidMessage,
    ];

    const isBodyValid = new ValidType('body', true, []);

    validTypes.forEach((type) => {
      if (!type.isValid) {
        isBodyValid.isValid = false;
        isBodyValid.errors = isBodyValid.errors.concat(type);
      }
    });

    return isBodyValid;
  }
}

module.exports.BodyValidator = BodyValidator;
