const crypto = require('crypto');
const bcrypt = require('bcrypt');
const config = require('config');

module.exports = {

  /**
   * Generates random characters
   *
   * @param {number} length
   * @returns {Promise}
   */
  generateRandomBytes(length) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(length, (err, buf) => {
        if (err) {
          return reject(err);
        }
        resolve(buf.toString('hex'));
      });
    });
  },

  /**
   * Creates a hash of a string
   *
   * @param {string} str
   * @param {number} saltFactor
   * @returns {Promise}
   */
  hashString(str, saltFactor = config.crypto.bcrypt_salt_factor) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(saltFactor, (err, salt) => {
        if (err) {
          return reject(err);
        }
        bcrypt.hash(str, salt, (err, hash) => {
          if (err) {
            return reject(err);
          }
          resolve(hash);
        });
      });
    });
  },

  /**
   * Compare a string with the hash
   *
   * @param {string} str
   * @param {string} hash
   * @returns {Promise}
   */
  validateHash(str, hash) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(str, hash, (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  }
};