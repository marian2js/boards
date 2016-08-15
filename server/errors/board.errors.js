const RequestError = require('./req.errors').RequestError;

class BoardNotFoundError extends RequestError {

  constructor(message) {
    super(`Board with ID "${message}" not found`);
    this.status = 404;
  }

}

class UnknownBoardError extends RequestError {

  constructor() {
    super('An unknown error was produced');
    this.status = 500;
  }

}

module.exports = {
  BoardNotFoundError,
  UnknownBoardError
};