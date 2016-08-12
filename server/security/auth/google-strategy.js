const passport = require('passport');
const PassportGoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const SocialAuthStrategy = require('./social-auth-strategy');
const config = require('config');

const STRATEGY_NAME = 'google';

class GoogleStrategy extends SocialAuthStrategy {

  constructor() {
    super(STRATEGY_NAME);
  }

  config() {
    const options = {
      clientID: config.auth.google.client_id,
      clientSecret: config.auth.google.client_secret,
      callbackURL: `${config.base_url}/auth/google/callback`
    };
    passport.use(new PassportGoogleStrategy(options, (accessToken, refreshToken, profile, done) => {
      super.findOrCreate(profile)
        .then(done)
        .catch(done);
    }));
  }

  auth() {
    return passport.authenticate(STRATEGY_NAME, {
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    });
  }

  authCallback() {
    return passport.authenticate(STRATEGY_NAME, {
      session: false
    });
  }
}

module.exports = GoogleStrategy;