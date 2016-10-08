const mongoose = require('mongoose');
const _ = require('lodash');
const TeamErrors = require('errors/team.errors');
const UserErrors = require('errors/user.errors');

const TeamUserSchema = new mongoose.Schema({
  _id: false,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  initials: {
    type: String,
    lowercase: true
  },
  is_owner: {
    type: Boolean,
    default: false,
    required: true
  }
});

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  users: [TeamUserSchema],
  created_at: {
    type: Date,
    default: Date.now,
    required: true
  }
});

TeamSchema
  .virtual('id')
  .get(function() {
    return this._id.toString();
  });

/**
 * Returns the data that can be sent to the client
 */
TeamSchema.methods.getReadableData = function () {
  return {
    id: this.id,
    name: this.name,
    users: this.users,
    created_at: this.created_at
  };
};

/**
 * Sets only the data that can be edited by the users
 */
TeamSchema.methods.setEditableData = function (data) {
  let editableKeys = [
    'name'
  ];
  let editableData = _.pick(data, editableKeys);
  _.forEach(editableData, (value, key) => {
    this[key] = value;
  });
};

/**
 * Add an user to the team
 */
TeamSchema.methods.addUser = function (user) {
  let newUser = {
    user: user.id,
  };
  let userExist = this.users.find(user => user.id === newUser.user);
  if (userExist) {
    throw new TeamErrors.DuplicateUserError();
  }
  let owner = this.users.find(user => user.is_owner);
  if (!owner) {
    newUser.is_owner = true;
  }
  newUser.initials = this._getNewInitials(user);
  this.users.push(newUser);
};

/**
 * Search for the best available initial for an user
 */
TeamSchema.methods._getNewInitials = function (user) {
  let listInitials = this.users.map(user => user.initials);

  // Set the best initials available
  let bestInitials = [];
  bestInitials.push(user.username[0]);
  bestInitials.push(user.first_name[0]);
  bestInitials.push(user.last_name[0]);
  bestInitials.push(user.email[0]);
  bestInitials.push(user.first_name[0] + user.last_name[0]);
  bestInitials.push(user.username.slice(0, 2));
  bestInitials.push(user.first_name.slice(0, 2));
  bestInitials.push(user.last_name.slice(0, 2));
  bestInitials.push(user.email.slice(0, 2));
  bestInitials = bestInitials.map(i => i.toLowerCase());
  bestInitials = _.uniq(bestInitials);
  for (let initials of bestInitials) {
    if (!listInitials.includes(initials)) {
      return initials;
    }
  }

  // Set the first letter available
  for (let i = 97; i <= 122; i++) {
    let initials = String.fromCharCode(i);
    if (!listInitials.includes(initials)) {
      return initials;
    }
  }

  // Set the first 2 letters available
  for (let x = 97; x <= 122; x++) {
    for (let y = 97; y <= 122; y++) {
      let initials = String.fromCharCode(x) + String.fromCharCode(y);
      if (!listInitials.includes(initials)) {
        return initials;
      }
    }
  }

  // The team is full
  throw new TeamErrors.TeamFullError();
};

/**
 * Find the teams that belongs to an user
 */
TeamSchema.statics.findByUserId = function (userId) {
  let query = {
    users: {
      $elemMatch: {
        user: userId,
        is_owner: true
      }
    }
  };
  let options = {
    sort: {
      created_at: -1
    }
  };
  return this.find(query, {}, options);
};

/**
 * Finds a team by ID only if the user is a member of the team
 */
TeamSchema.statics.verifyPermissions = function (teamId, userId) {
  return this.findById(teamId)
    .then(team => {
      if (!team) {
        throw new TeamErrors.TeamNotFoundError(teamId);
      }
      let member = team.users.find(user => user.id === userId);
      if (!member) {
        throw new UserErrors.UnauthorizedUserError();
      }
      return {
        team
      };
    });
};

/**
 * Teams should have exactly one owner
 */
TeamSchema.pre('save', function (next) {
  let owners = this.users.filter(user => user.is_owner);
  if (owners.length !== 1) {
    return next(new TeamErrors.OwnersCountError());
  }
  next();
});

module.exports = mongoose.model('teams', TeamSchema);
