const passport = require('passport');
const PassportGoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GoogleStrategy = require('security/auth/google-strategy');
const SocialAuthStrategy = require('security/auth/social-auth-strategy');

describe('Google Strategy', () => {

  it('should extend from SocialAuthStrategy', () => {
    expect(new GoogleStrategy() instanceof SocialAuthStrategy).toBe(true);
  });

  describe('constructor', () => {
    it('should set the provider name', () => {
      let strategy = new GoogleStrategy();
      expect(strategy.name).toBe('google');
    });
  });

  describe('config', () => {
    beforeEach(() => {
      spyOn(passport, 'use');
    });

    it('should set a new Google strategy on passport', () => {
      let strategy = new GoogleStrategy();
      strategy.config();
      expect(passport.use).toHaveBeenCalledWith(jasmine.any(PassportGoogleStrategy));
    });
  });

  describe('auth', () => {
    beforeEach(() => {
      spyOn(passport, 'authenticate')
    });

    it('should configure passport for start the authentication', () => {
      let strategy = new GoogleStrategy();
      strategy.auth();
      expect(passport.authenticate).toHaveBeenCalledWith('google', {
        scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email'
        ]
      });
    });
  });

  describe('authCallback', () => {
    beforeEach(() => {
      spyOn(passport, 'authenticate');
    });

    it('should configure passport for the auth callback', () => {
      let strategy = new GoogleStrategy();
      strategy.authCallback();
      expect(passport.authenticate).toHaveBeenCalledWith('google', {
        session: false
      });
    });
  });
});