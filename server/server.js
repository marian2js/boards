const http = require('http');
const config = require('./config');

module.exports = {

  start(app) {
    return this._configServer(app);
  },

  /**
   * Configs Express Server
   *
   * @param app
   * @returns {Promise}
   * @private
   */
  _configServer(app) {
    return new Promise((resolve, reject) => {
      this._httpServer = http.createServer(app);
      this._port = this._normalizePort(config.port);
      app.set('port', this._port);
      this._httpServer.listen(this._port);
      this._httpServer.on('listening', resolve);
      this._httpServer.on('error', reject);
    });
  },

  /**
   * Normalize a port into a number, string, or false.
   *
   * @param val
   * @returns {number|string|boolean}
   * @private
   */
  _normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  },

  get httpServer() {
    return this._httpServer;
  },

  get port() {
    return this._port;
  }

};