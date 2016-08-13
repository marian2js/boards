const DEFAULT_STATUS_CODE = 500;

class RequestError extends Error {

  constructor(message) {
    super(message);
    this.message = message;
    this.name = this.constructor.name;
    this.status = DEFAULT_STATUS_CODE;
  }

}

module.exports = {
  RequestError
};