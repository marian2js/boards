const mongoose = require('mongoose');

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
  }
});

module.exports = mongoose.model('user', UserSchema);