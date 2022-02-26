/* eslint-disable no-console */
const chalk = require('chalk');

module.exports.log = (msg) => {
  console.log(chalk.white(`${process.pid}: ${msg}`));
};

module.exports.logSuccess = (msg) => {
  console.log(chalk.green(`${process.pid}: ${msg}`));
};

module.exports.logError = (errorMsg) => {
  console.log(chalk.red(`${process.pid}: ${errorMsg}`));
};
