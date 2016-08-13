const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');
const CryptoUtils = require('../utils/crypto.utils');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    lowercase: true,
    index: {
      unique: true
    }
  },
  email: {
    type: String,
    lowercase: true,
    required: true,
    index: {
      unique: true
    }
  },
  first_name: String,
  last_name: String,
  gender: String,
  birthday: Date,
  created_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  access_token_request_code: String
});

UserSchema
  .virtual('id')
  .get(function() {
    return this._id.toString();
  });

/**
 * Generates a code for requesting the access token and stores its hash
 *
 * @returns {Promise}
 */
UserSchema.methods.generateAccessTokenRequestCode = function() {
  let data = {};
  return CryptoUtils.generateRandomBytes(config.auth.request_code_length)
    .then(code => {
      data.code = code;
      return CryptoUtils.hashString(code);
    })
    .then(hash => {
      this.access_token_request_code = hash;
      return this.save();
    })
    .then(() => data.code);
};

/**
 * Creates a new jwt based on a secret
 *
 * @param {string} code
 * @returns {Promise}
 */
UserSchema.methods.getAccessToken = function(code) {
  let data = {};
  return CryptoUtils.validateHash(code, this.access_token_request_code)
    .then(isValid => {
      data.isValid = isValid;

      // if the code is valid, remove it from the user's model
      if (isValid) {
        this.access_token_request_code = undefined;
        return this.save();
      }
    })
    .then(() => {
      if (data.isValid) {
        return jwt.sign(this._id, config.secrets.jwt);
      }
    });
};

module.exports = mongoose.model('user', UserSchema);