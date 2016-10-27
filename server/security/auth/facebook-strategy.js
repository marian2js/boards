const passport = require('passport');
const PassportFacebookStrategy = require('passport-facebook').Strategy;
const SocialAuthStrategy = require('./social-auth-strategy');
const config = require('config');

const STRATEGY_NAME = 'facebook';

class FacebookStrategy extends SocialAuthStrategy {

  constructor() {
    super(STRATEGY_NAME);
  }

  config() {
    const options = {
      clientID: config.auth.facebook.client_id,
      clientSecret: config.auth.facebook.client_secret,
      callbackURL: `${config.base_url}/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name'],
      enableProof: true
    };
    passport.use(new PassportFacebookStrategy(options, (accessToken, refreshToken, profile, done) => {
      super.findOrCreate(profile)
        .then(done)
        .catch(done);
    }));
  }

  auth() {
    return passport.authenticate('facebook', {
      scope: [
        'public_profile',
        'email'
      ]
    });
  }

  authCallback() {
    return passport.authenticate(STRATEGY_NAME, {
      session: false
    });
  }
}

module.exports = FacebookStrategy;