const RequestError = require('./req.errors').RequestError;

class RelationNotFoundError extends RequestError {

  constructor(message) {
    super(`Relation with ID "${message}" not found`);
    this.status = 404;
  }

}

class UnknownRelationError extends RequestError {

  constructor(message) {
    super(message || 'An unknown error was produced');
    this.status = 500;
  }

}

module.exports = {
  RelationNotFoundError,
  UnknownRelationError
};