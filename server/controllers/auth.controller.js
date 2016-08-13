const StrategyFactory = require('security/auth/strategy-factory');
const AuthErrors = require('errors/auth.errors');
const Logger = require('utils/logger');
const logger = new Logger('User Controller');

module.exports = {

  /**
   * Starts the authentication process
   */
  authProvider(req, res, next) {
    const provider = req.params.provider;
    const strategy = StrategyFactory.create(provider);
    if (!strategy || !strategy.auth) {
      logger.debug(`Unknown provider "${provider}"`);
      return next(new AuthErrors.UnknownProviderError(provider));
    }
    strategy.auth()(req, res, next);
  },

  /**
   * Process the callback received after the authentication
   */
  authProviderCallback(req, res, next) {
    const provider = req.params.provider;
    const strategy = StrategyFactory.create(provider);
    if (!strategy || !strategy.authCallback) {
      logger.debug(`Unknown provider "${provider}"`);
      return next(new AuthErrors.UnknownProviderError(provider));
    }
    strategy.authCallback()(req, res, data => {
      if (data.user && data.user.id && data.code) {
        res.redirect(`/process-login?id=${data.user.id}&code=${data.code}`);
      } else {
        next(new AuthErrors.AuthFailedError());
      }
    });
  }

};