const RequestError = require('./req.errors').RequestError;

class UnknownBoardError extends RequestError {

  constructor() {
    super('An unknown error was produced');
    this.status = 500;
  }

}

module.exports = {
  UnknownBoardError
};