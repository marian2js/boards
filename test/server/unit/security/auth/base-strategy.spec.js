const BaseStrategy = require('security/auth/base-strategy');

describe('Base Adapter', () => {

  describe('constructor', () => {
    it('should set the name of the provider', () => {
      let strategy = new BaseStrategy('test_name');
      expect(strategy.name).toBe('test_name');
    });
  });

});