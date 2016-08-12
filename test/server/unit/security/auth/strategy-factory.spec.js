const StrategyFactory = require('security/auth/strategy-factory');
const GoogleStrategy = require('security/auth/google-strategy');

describe('Strategy Factory', () => {

  describe('create', () => {
    beforeEach(() => {
      StrategyFactory._cache = {};
      spyOn(GoogleStrategy.prototype, 'config');
    });

    it('should create and cache a Google Strategy', () => {
      let strategy = StrategyFactory.create('google');
      expect(strategy instanceof GoogleStrategy).toBe(true);
      expect(StrategyFactory._cache.google).toBe(strategy);
    });

    it('should config the strategy after create it', () => {
      StrategyFactory.create('google');
      expect(GoogleStrategy.prototype.config).toHaveBeenCalled();
    });

    it('should use the cached version of the strategy', () => {
      let strategy1 = StrategyFactory.create('google');
      let strategy2 = StrategyFactory.create('google');
      expect(strategy1).toBe(strategy2);
      expect(GoogleStrategy.prototype.config.calls.count()).toBe(1);
    });
  });

});