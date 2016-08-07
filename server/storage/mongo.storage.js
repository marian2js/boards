const mongoose = require('mongoose');
const config = require('../config');
const Logger = require('utils/logger');
const logger = new Logger('Mongo Storage');

module.exports = {

  connect() {
    mongoose.Promise = Promise;
    return mongoose.connect(config.mongo.uri, config.mongo.options || {})
      .then(() => logger.debug('Connected to MongoDB'));
  }

};