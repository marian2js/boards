const RequestError = require('./req.errors').RequestError;

class TeamNotFoundError extends RequestError {

  constructor(message) {
    super(`Team with ID "${message}" not found`);
    this.status = 404;
  }

}

class OwnersCountError extends RequestError {

  constructor() {
    super(`Teams can only have one owner`);
    this.status = 400;
  }

}

class DuplicateUserError extends RequestError {

  constructor() {
    super(`The user already exists on the team`);
    this.status = 400;
  }

}

class TeamFullError extends RequestError {

  constructor() {
    super(`The team reached its maximum amount of users`);
    this.status = 400;
  }

}

class UnknownTeamError extends RequestError {

  constructor() {
    super('An unknown error was produced');
    this.status = 500;
  }

}

module.exports = {
  TeamNotFoundError,
  OwnersCountError,
  DuplicateUserError,
  TeamFullError,
  UnknownTeamError
};