const SocialAuthStrategy = require('security/auth/social-auth-strategy');
const BaseStrategy = require('security/auth/base-strategy');
const User = require('models/user.model');

describe('Social Auth Strategy', () => {
  let profileData;

  beforeEach(() => {
    profileData = {
      id: 123,
      emails: [{
        value: 'test@example.com'
      }],
      name: {
        givenName: 'first name',
        familyName: 'last name'
      },
      _json: {
        gender: 'gender'
      }
    };
  });

  it('should extend from AbstractStrategy', () => {
    expect(new SocialAuthStrategy() instanceof BaseStrategy).toBe(true);
  });

  describe('completeData', () => {
    it('should complete user\'s data', () => {
      let strategy = new SocialAuthStrategy('test');
      let user = {};
      strategy.completeData(user, profileData);
      expect(user.test_id).toBe(123);
      expect(user.email).toBe('test@example.com');
      expect(user.first_name).toBe('first name');
      expect(user.last_name).toBe('last name');
      expect(user.gender).toBe('gender');
    });

    it('should not overwrite existent user\'s data', () => {
      let strategy = new SocialAuthStrategy('test');
      let user = {
        test_id: 321,
        email: 'another@example.com',
        first_name: 'test first name',
        last_name: 'test last name'
      };
      strategy.completeData(user, profileData);
      expect(user.test_id).toBe(321);
      expect(user.email).toBe('another@example.com');
      expect(user.first_name).toBe('test first name');
      expect(user.last_name).toBe('test last name');
      expect(user.gender).toBe('gender');
    });
  });

  describe('findOrCreate', () => {
    it('should create and prepare a new user', done => {
      spyOn(User, 'findOne').and.returnValue(Promise.resolve());
      spyOn(User.prototype, 'generateAccessTokenRequestCode')
        .and.returnValue(Promise.resolve('test_code'));

      let strategy = new SocialAuthStrategy('test');
      strategy.findOrCreate(profileData)
        .then(result => {
          expect(result).toEqual({
            user: jasmine.any(Object),
            code: 'test_code'
          });
          expect(User.findOne).toHaveBeenCalledWith({
            $or: [{
              test_id: 123
            }, {
              email: 'test@example.com'
            }]
          });
          expect(User.prototype.generateAccessTokenRequestCode).toHaveBeenCalledWith();
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should find an user and get the code', done => {
      spyOn(User, 'findOne').and.returnValue(Promise.resolve({
        generateAccessTokenRequestCode() {
          return Promise.resolve('test_code');
        },
        save() {
          return Promise.resolve();
        }
      }));

      let strategy = new SocialAuthStrategy('test');
      strategy.findOrCreate(profileData)
        .then(result => {
          expect(result).toEqual({
            user: jasmine.any(Object),
            code: 'test_code'
          });
          expect(User.findOne).toHaveBeenCalledWith({
            $or: [{
              test_id: 123
            }, {
              email: 'test@example.com'
            }]
          });
          done();
        });
    });
  });

  describe('get providerKey', () => {
    it('should return the provier key', () => {
      let strategy = new SocialAuthStrategy('test_provider');
      expect(strategy.providerKey).toBe('test_provider_id');
    });
  });

});