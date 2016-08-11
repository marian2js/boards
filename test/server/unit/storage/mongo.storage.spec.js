const mongoose = require('mongoose');
const MongoStorage = require('storage/mongo.storage');

describe('Mongo Storage', () => {

  describe('Connect', () => {
    it('should connect to mongo DB', done => {
      spyOn(mongoose, 'connect').and.returnValue(Promise.resolve());

      MongoStorage.connect()
        .then(() => {
          expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost/boards-test', {});
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should reject the promise if there is an error connecting to mongo DB', done => {
      spyOn(mongoose, 'connect').and.returnValue(Promise.reject('test_error'));

      MongoStorage.connect()
        .catch(err => {
          expect(err).toBe('test_error');
          done();
        });
    });
  });

});