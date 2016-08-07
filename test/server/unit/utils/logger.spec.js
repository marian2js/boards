const Logger = require('utils/logger');
const Winston = require('winston');

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger('test');
  });

  beforeEach(() => {
    spyOn(Winston.Logger.prototype, 'log').and.returnValue(null);
  });

  describe('constructor', () => {
    it('should set the name of the logger', () => {
      expect(logger.name).toBe('test');
    });
  });

  describe('debug', () => {
    it('should log at debug level', () => {
      logger.debug('Message');
      expect(Winston.Logger.prototype.log).toHaveBeenCalledWith('debug', '[test]', 'Message');
    });
  });

  describe('info', () => {
    it('should log at info level', () => {
      logger.info('Message');
      expect(Winston.Logger.prototype.log).toHaveBeenCalledWith('info', '[test]', 'Message');
    });
  });

  describe('warn', () => {
    it('should log at warn level', () => {
      logger.warn('Message');
      expect(Winston.Logger.prototype.log).toHaveBeenCalledWith('warn', '[test]', 'Message');
    });
  });

  describe('error', () => {
    it('should log at error level', () => {
      logger.error('Message');
      expect(Winston.Logger.prototype.log).toHaveBeenCalledWith('error', '[test]', 'Message');
    });
  });

  describe('statics', () => {
    it('should return the current debug level', () => {
      expect(Logger.level).toBe('debug');
    });
  });
});