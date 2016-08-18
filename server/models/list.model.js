const mongoose = require('mongoose');
const _ = require('lodash');
const Board = require('models/board.model');
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
    required: true
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

module.exports = mongoose.model('lists', ListSchema);