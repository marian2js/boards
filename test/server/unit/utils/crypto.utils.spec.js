const crypto = require('crypto');
const bcrypt = require('bcrypt');
const config = require('config');
const CryptoUtils = require('utils/crypto.utils');

describe('Crypto Utils', () => {

  describe('generateRandomBytes', () => {
    it('should resolve the promise with the result', done => {
      spyOn(crypto, 'randomBytes').and.callFake((length, cb) => {
        cb(null, 'random_string');
      });

      CryptoUtils.generateRandomBytes(24)
        .then(result => {
          expect(crypto.randomBytes).toHaveBeenCalledWith(24, jasmine.any(Function));
          expect(result).toBe('random_string');
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should reject the promise if there is an error', done => {
      spyOn(crypto, 'randomBytes').and.callFake((length, cb) => {
        cb('test_error');
      });

      CryptoUtils.generateRandomBytes(24)
        .catch(err => {
          expect(err).toBe('test_error');
          done();
        });
    });
  });

  describe('hashString', () => {
    it('should resolve the promise with the string hashed', done => {
      spyOn(bcrypt, 'genSalt').and.callFake((factor, cb) => {
        cb(null, 'salt');
      });
      spyOn(bcrypt, 'hash').and.callFake((str, salt, cb) => {
        cb(null, 'string_hashed');
      });

      CryptoUtils.hashString('string', 8)
        .then(data => {
          expect(bcrypt.genSalt).toHaveBeenCalledWith(8, jasmine.any(Function));
          expect(bcrypt.hash).toHaveBeenCalledWith('string', 'salt', jasmine.any(Function));
          expect(data).toBe('string_hashed');
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should reject the promise if there is an error generating the salt', done => {
      spyOn(bcrypt, 'genSalt').and.callFake((factor, cb) => {
        cb('test_error');
      });
      spyOn(bcrypt, 'hash').and.callFake((str, salt, cb) => {
        cb(null, 'string_hashed');
      });

      CryptoUtils.hashString('string', 8)
        .catch(err => {
          expect(err).toBe('test_error');
          done();
        });
    });

    it('should reject the promise if there is an error hashing the string', done => {
      spyOn(bcrypt, 'genSalt').and.callFake((factor, cb) => {
        cb(null, 'salt');
      });
      spyOn(bcrypt, 'hash').and.callFake((str, salt, cb) => {
        cb('test_error');
      });

      CryptoUtils.hashString('string', 8)
        .catch(err => {
          expect(err).toBe('test_error');
          done();
        });
    });
  });

  describe('validateHash', () => {
    it('should resolve the promise with the result', done => {
      spyOn(bcrypt, 'compare').and.callFake((str, hash, cb) => {
        cb(null, true);
      });

      CryptoUtils.validateHash('string', 'hash')
        .then(result => {
          expect(bcrypt.compare).toHaveBeenCalledWith('string', 'hash', jasmine.any(Function));
          expect(result).toBe(true);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should reject the promise if there is an error', done => {
      spyOn(bcrypt, 'compare').and.callFake((str, hash, cb) => {
        cb('test_error');
      });

      CryptoUtils.validateHash('string', 'hash')
        .catch(err => {
          expect(err).toBe('test_error');
          done();
        });
    });
  });

});