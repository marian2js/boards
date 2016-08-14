const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
const MongoStorage = require('storage/mongo.storage');

let dbMocked = false;

module.exports = {

  mockDb(done) {
    if (dbMocked) {
      return done();
    }
    mockgoose(mongoose)
      .then(() => MongoStorage.connect())
      .then(() => {
        dbMocked = true;
        done();
      });
  }

};