const RequestError = require('./req.errors').RequestError;

class InvalidRangeError extends RequestError {

  constructor(message) {
    super(`Invalid ${message} range`);
    this.status = 400;
  }

}

module.exports = {
  InvalidRangeError
};