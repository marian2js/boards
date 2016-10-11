const mongoose = require('mongoose');
const _ = require('lodash');
const BoardErrors = require('errors/board.errors');
const UserErrors = require('errors/user.errors');

const BoardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  vertical_relation: Boolean,
  horizontal_relation: Boolean,
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  language: {
    type: String,
    enum: [
      'english',
      'spanish'
    ],
    default: 'english'
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true
  }
});

BoardSchema
  .virtual('id')
  .get(function() {
    return this._id.toString();
  });

/**
 * Returns the data that can be sent to the client
 */
BoardSchema.methods.getReadableData = function () {
  return {
    id: this.id,
    name: this.name,
    vertical_relation: this.vertical_relation,
    horizontal_relation: this.horizontal_relation,
    team: this.team,
    language: this.language,
    created_at: this.created_at
  };
};

/**
 * Sets only the data that can be edited by the users
 */
BoardSchema.methods.setEditableData = function (data) {
  let editableKeys = [
    'name',
    'vertical_relation',
    'horizontal_relation',
    'team',
    'language'
  ];
  let editableData = _.pick(data, editableKeys);
  _.forEach(editableData, (value, key) => {
    this[key] = value;
  });
};

/**
 * Find the boards that belongs to an user
 */
BoardSchema.statics.findByUserId = function (userId) {
  let query = {
    user: userId
  };
  let options = {
    sort: {
      created_at: -1
    }
  };
  return this.find(query, {}, options);
};

/**
 * Finds a board by ID only if the user has permissions to use it
 */
BoardSchema.statics.verifyPermissions = function (boardId, userId) {
  return this.findById(boardId)
    .then(board => {
      if (!board) {
        throw new BoardErrors.BoardNotFoundError(boardId);
      }
      if (board.user.toString() !== userId.toString()) {
        throw new UserErrors.UnauthorizedUserError();
      }
      return {
        board
      };
    });
};

/**
 * Validate the presence of a vertical or horizontal relation
 */
BoardSchema.pre('save', function (next) {
  if (!this.vertical_relation && !this.horizontal_relation) {
    return next(new BoardErrors.FieldRequiredError('Horizontal or vertical relation'));
  }
  return next();
});

module.exports = mongoose.model('boards', BoardSchema);