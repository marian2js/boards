const RequestError = require('./req.errors').RequestError;

class ListNotFoundError extends RequestError {

  constructor(message) {
    super(`List with ID "${message}" not found`);
    this.status = 404;
  }

}

class UnknownListError extends RequestError {

  constructor(message) {
    super(message || 'An unknown error was produced');
    this.status = 500;
  }

}

module.exports = {
  ListNotFoundError,
  UnknownListError
};