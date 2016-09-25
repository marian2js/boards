const RequestError = require('./req.errors').RequestError;

class ItemNotFoundError extends RequestError {

  constructor(message) {
    super(`Item with ID "${message}" not found`);
    this.status = 404;
  }

}

class UnknownItemError extends RequestError {

  constructor(message) {
    super(message || 'An unknown error was produced');
    this.status = 500;
  }

}

module.exports = {
  ItemNotFoundError,
  UnknownItemError
};