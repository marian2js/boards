const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
const MongoStorage = require('storage/mongo.storage');

module.exports = {

  mockDb(done) {
    mockgoose(mongoose)
      .then(() => MongoStorage.connect())
      .then(() => done());
  }

};