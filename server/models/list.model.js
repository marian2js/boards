const mongoose = require('mongoose');
const _ = require('lodash');
const Board = require('models/board.model');
const ModelUtils = require('utils/model.utils');
const ListErrors = require('errors/list.errors');

const ListSchema = new mongoose.Schema({
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  position: {
    type: Number,
    required: true,

    // if the position is changed, keep track of the old position
    set: function(position) {
      this._oldPosition = this.position;
      return position;
    }
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true
  }
});

ListSchema
  .virtual('id')
  .get(function() {
    return this._id.toString();
  });

/**
 * Returns the data that can be sent to the client
 */
ListSchema.methods.getReadableData = function () {
  return {
    id: this.id,
    board: this.board,
    name: this.name,
    position: this.position,
    created_at: this.created_at
  };
};

/**
 * Sets only the data that can be edited by the users
 */
ListSchema.methods.setEditableData = function (data) {
  let editableKeys = [
    'name',
    'position'
  ];
  let editableData = _.pick(data, editableKeys);
  _.forEach(editableData, (value, key) => {
    this[key] = value;
  });
};

/**
 * Find the lists of a board
 */
ListSchema.statics.findByBoardId = function (boardId) {
  let query = {
    board: boardId
  };
  let options = {
    sort: {
      position: 1
    }
  };
  return this.find(query, {}, options);
};

/**
 * Finds a list by ID only if the user has permissions to use it
 */
ListSchema.statics.verifyPermissions = function (listId, userId) {
  let data = {};
  return this.findById(listId)
    .then(list => {
      if (!list) {
        throw new ListErrors.ListNotFoundError(listId);
      }
      data.list = list;
      return Board.verifyPermissions(list.board, userId);
    })
    .then(board => Object.assign(data, board));
};

/**
 * [Pre Save Hook]
 * Validate that the position is between 0 and the count of lists in the board
 */
ListSchema.pre('save', function (next) {
  let countQuery = {
    board: this.board
  };
  ModelUtils.validatePosition(List, this.position, this._oldPosition, this.isNew, countQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Pre Save Hook]
 * Update the positions of the lists in the board
 */
ListSchema.pre('save', function (next) {
  let updateQuery = {
    board: this.board
  };
  ModelUtils.updatePositions(List, this.position, this._oldPosition, updateQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Post Remove Hook]
 * Update the positions of the following lists in the board
 */
ListSchema.post('remove', function (next) {
  let updateQuery = {
    board: this.board
  };
  ModelUtils.updatePositions(List, this.position, -1, updateQuery)
    .then(() => next())
    .catch(next);
});

const List = mongoose.model('lists', ListSchema);
module.exports = List;