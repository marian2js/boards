const BaseStrategy = require('./base-strategy');
const User = require('models/user.model');

class SocialAuthStrategy extends BaseStrategy {

  /**
   * Complete missing user data
   *
   * @param user
   * @param data
   */
  completeData(user, data) {
    // Provider ID
    if (!user[this.providerKey]) {
      user[this.providerKey] = data.id;
    }

    // Email
    if (!user.email && data.emails && data.emails[0].value) {
      user.email = data.emails[0].value;
    }

    // First Name
    if (!user.first_name && data.name && data.name.givenName) {
      user.first_name = data.name.givenName;
    }

    // Last Name
    if (!user.last_name && data.name && data.name.familyName) {
      user.last_name = data.name.familyName;
    }

    // Gender
    if (!user.gender && data._json.gender) {
      user.gender = data._json.gender;
    }
  }

  /**
   * Finds or creates a new user and send the code for requesting the access token
   *
   * @param profile
   * @returns {Promise}
   */
  findOrCreate(profile) {
    console.log('profile', profile);
    let data = {};
    let query = {
      $or: [{
        [this.providerKey]: profile.id
      }, {
        email: profile.emails[0].value
      }]
    };
    return User.findOne(query)
      .then(user => {
        if(!user) {
          user = new User();
        }
        data.user = user;
        this.completeData(user, profile);
        return user.save();
      })
      .then(() => {
        return data.user.generateAccessTokenRequestCode()
      })
      .then(code => {
        return {
          user: data.user,
          code
        };
      });
  }

  get providerKey() {
    return `${this.name}_id`;
  }

}

module.exports = SocialAuthStrategy;