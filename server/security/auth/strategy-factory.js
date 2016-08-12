const GoogleStrategy = require('./google-strategy');

const providers = {
  google: GoogleStrategy
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