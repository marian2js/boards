const RequestError = require('./req.errors').RequestError;

class TaskNotFoundError extends RequestError {

  constructor(message) {
    super(`Task with ID "${message}" not found`);
    this.status = 404;
  }

}

class UnknownTaskError extends RequestError {

  constructor(message) {
    super(message || 'An unknown error was produced');
    this.status = 500;
  }

}

module.exports = {
  TaskNotFoundError,
  UnknownTaskError
};