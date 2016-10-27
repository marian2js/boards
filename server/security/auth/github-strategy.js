const passport = require('passport');
const PassportGithubStrategy = require('passport-github').Strategy;
const SocialAuthStrategy = require('./social-auth-strategy');
const config = require('config');

const STRATEGY_NAME = 'github';

class GithubStrategy extends SocialAuthStrategy {

  constructor() {
    super(STRATEGY_NAME);
  }

  config() {
    const options = {
      clientID: config.auth.github.client_id,
      clientSecret: config.auth.github.client_secret,
      callbackURL: `${config.base_url}/auth/github/callback`
    };
    passport.use(new PassportGithubStrategy(options, (accessToken, refreshToken, profile, done) => {
      super.findOrCreate(profile)
        .then(done)
        .catch(done);
    }));
  }

  auth() {
    return passport.authenticate(STRATEGY_NAME);
  }

  authCallback() {
    return passport.authenticate(STRATEGY_NAME, {
      session: false
    });
  }
}

module.exports = GithubStrategy;