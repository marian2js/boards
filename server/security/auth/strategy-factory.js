const GoogleStrategy = require('./google-strategy');
const FacebookStrategy = require('./facebook-strategy');
const GithubStrategy = require('./github-strategy');

const providers = {
  google: GoogleStrategy,
  facebook: FacebookStrategy,
  github: GithubStrategy
};

module.exports = {
  _cache: {},

  create(provider) {
    if (!providers[provider]) {
      return null;
    }

    // Initialize the strategy and store the instance
    if (!this._cache[provider]) {
      this._cache[provider] = new providers[provider]();
      this._cache[provider].config();
    }

    return this._cache[provider];
  }

};