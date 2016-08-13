const RequestError = require('./req.errors').RequestError;

class UserNotFoundError extends RequestError {

  constructor(message) {
    super(`User with ID "${message}" not found`);
    this.status = 404;
  }

}

class InvalidAccessTokenError extends RequestError {

  constructor() {
    super('The access token is invalid');
    this.status = 401;
  }

}

class InvalidRequestAccessTokenCodeError extends RequestError {

  constructor() {
    super('The code for requesting the access token is invalid');
    this.status = 401;
  }

}

class UnauthorizedUserError extends RequestError {

  constructor() {
    super('You do not have the necessary permissions');
    this.status = 403;
  }

}

class UnknownUserError extends RequestError {

  constructor() {
    super('The code for requesting the access token is invalid');
    this.status = 500;
  }

}

module.exports = {
  UserNotFoundError,
  InvalidAccessTokenError,
  InvalidRequestAccessTokenCodeError,
  UnauthorizedUserError,
  UnknownUserError
};