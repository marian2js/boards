const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
const jwt = require('jsonwebtoken');
const User = require('models/user.model');
const CryptoUtils = require('utils/crypto.utils');
const TestUtils  = require('../test.utils');

describe('User Model', () => {
  // Mock DataBase
  beforeAll(TestUtils.mockDb);

  beforeEach(done => mockgoose.reset(() => done()));

  let user;
  let createUser = (props = {}) => {
    const defaults = {
      email: 'email@example.com'
    };
    user = new User(Object.assign(defaults, props));
    return user.save();
  };

  // Ensure user is cleaned after each test
  afterEach(() => user = undefined);
  
  describe('Constructor', () => {
    it('should create an user with defaults', done => {
      createUser()
        .then(() => {
          expect(user.id).toBe(user._id.toString());
          expect(user.email).toBe('email@example.com');
          expect(user.created_at).toEqual(jasmine.any(Date));
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should fail if the user doesn\'t have all the required data', done => {
      user = new User();
      user.save()
        .catch(err => {
          expect(err.errors.email.message).toBe('Path `email` is required.');
          done();
        })
    });
  });

  describe('generateAccessTokenRequestCode', () => {
    it('should generate a code and store its hash', done => {
      spyOn(CryptoUtils, 'generateRandomBytes').and.returnValue(Promise.resolve('random_code'));
      spyOn(CryptoUtils, 'hashString').and.returnValue(Promise.resolve('hashed'));

      createUser()
        .then(() => user.generateAccessTokenRequestCode())
        .then(code => {
          expect(code).toBe('random_code');
          expect(user.access_token_request_code).toBe('hashed');
          expect(CryptoUtils.generateRandomBytes).toHaveBeenCalledWith(32);
          expect(CryptoUtils.hashString).toHaveBeenCalledWith('random_code');
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should reject the promise if there is an error generating the code', done => {
      spyOn(CryptoUtils, 'generateRandomBytes').and.returnValue(Promise.reject('test_error'));
      spyOn(CryptoUtils, 'hashString').and.returnValue(Promise.resolve('hashed'));

      createUser()
        .then(() => user.generateAccessTokenRequestCode())
        .catch(err => {
          expect(err).toBe('test_error');
          done();
        });
    });

    it('should reject the promise if there is an error hashing the code', done => {
      spyOn(CryptoUtils, 'generateRandomBytes').and.returnValue(Promise.resolve('random_code'));
      spyOn(CryptoUtils, 'hashString').and.returnValue(Promise.reject('test_error'));

      createUser()
        .then(() => user.generateAccessTokenRequestCode())
        .catch(err => {
          expect(err).toBe('test_error');
          done();
        });
    });
  });

  describe('getAccessToken', () => {
    it('should return a jwt token if the code used is valid', done => {
      spyOn(CryptoUtils, 'validateHash').and.returnValue(Promise.resolve(true));
      spyOn(jwt, 'sign').and.returnValue('access_token');

      let props = {
        access_token_request_code: 'hashed_code'
      };
      createUser(props)
        .then(() => user.getAccessToken('random_code'))
        .then(accessToken => {
          expect(accessToken).toBe('access_token');
          expect(CryptoUtils.validateHash).toHaveBeenCalledWith('random_code', 'hashed_code');
          expect(jwt.sign).toHaveBeenCalledWith({ id: user.id }, 'jwt_secret');
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should remove the hashed code after its used', done => {
      spyOn(CryptoUtils, 'validateHash').and.returnValue(Promise.resolve(true));
      spyOn(jwt, 'sign').and.returnValue('access_token');

      let props = {
        access_token_request_code: 'hashed_code'
      };
      createUser(props)
        .then(() => user.getAccessToken('random_code'))
        .then(() => {
          expect(user.access_token_request_code).toBe(undefined);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should not return an access token if the code is not valid', done => {
      spyOn(CryptoUtils, 'validateHash').and.returnValue(Promise.resolve(false));
      spyOn(jwt, 'sign').and.returnValue('access_token');

      let props = {
        access_token_request_code: 'hashed_code'
      };
      createUser(props)
        .then(() => user.getAccessToken('random_code'))
        .then(accessToken => {
          expect(accessToken).not.toBeDefined();
          expect(CryptoUtils.validateHash).toHaveBeenCalledWith('random_code', 'hashed_code');
          expect(jwt.sign).not.toHaveBeenCalled();
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should reject the promise if there is an error validating the hash', done => {
      spyOn(CryptoUtils, 'validateHash').and.returnValue(Promise.reject('test_error'));

      let props = {
        access_token_request_code: 'hashed_code'
      };
      createUser(props)
        .then(() => user.getAccessToken('random_code'))
        .catch(err => {
          expect(err).toBe('test_error');
          done();
        });
    });
  });
});