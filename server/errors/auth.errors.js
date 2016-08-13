class AuthError extends Error {

  constructor(message) {
    super(message);
    this.message = message;
    this.name = this.constructor.name;
  }

}

class UnknownProviderError extends AuthError {

  constructor(message) {
    super(`Unknown provider "${message}"`);
    this.status = 404;
  }

}

class AuthFailedError extends AuthError {

  constructor(message) {
    super(message || 'Authentication Failed');
    this.status = 401;
  }

}

module.exports = {
  AuthError,
  UnknownProviderError,
  AuthFailedError
};