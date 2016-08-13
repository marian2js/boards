const RequestError = require('./req.errors').RequestError;

class UnknownProviderError extends RequestError {

  constructor(message) {
    super(`Unknown provider "${message}"`);
    this.status = 404;
  }

}

class AuthFailedError extends RequestError {

  constructor(message) {
    super(message || 'Authentication Failed');
    this.status = 401;
  }

}

module.exports = {
  UnknownProviderError,
  AuthFailedError
};