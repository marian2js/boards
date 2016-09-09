import logging
from config import config


class Logger:
    def __init__(self, name):
        self._logger = logging.getLogger(name)

    def debug(self, msg):
        self._logger.debug(msg)

    def info(self, msg):
        self._logger.info(msg)

    def warn(self, msg):
        self._logger.warn(msg)

    def error(self, msg):
        self._logger.error(msg)

    @staticmethod
    def set_level(level):
        log_level = level or config['log_level']
        log_level = log_level.upper()
        logging.basicConfig(level=log_level)
        logging.getLogger().setLevel(log_level)

# Set logger level
Logger.set_level('')
