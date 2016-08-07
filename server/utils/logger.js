const Winston = require('winston');
const config = require('../config');

const winston = new Winston.Logger({
  level: config.logs.level,
  transports: [
    new (Winston.transports.Console)()
  ]
});

class Logger {

  constructor(name) {
    this.name = name;
  }

  debug() {
    winston.debug(`[${this.name}]`, ...arguments);
  }

  info() {
    winston.info(`[${this.name}]`, ...arguments);
  }

  warn() {
    winston.warn(`[${this.name}]`, ...arguments);
  }

  error() {
    winston.error(`[${this.name}]`, ...arguments);
  }

  static get level() {
    return config.logs.level;
  }

}

module.exports = Logger;