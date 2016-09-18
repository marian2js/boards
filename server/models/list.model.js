const mongoose = require('mongoose');
const _ = require('lodash');
const Board = require('models/board.model');
const ModelUtils = require('utils/model.utils');
const DataUtils = require('utils/data.utils');
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
 * Update a list with raw data
 */
ListSchema.methods.updateWithData = function (data, index) {
  if (!this.name && data.text) {
    this.name = data.text;
  }
  this.position = index;
  this.tasks = data.tasks;
  this.skip_position_validation = true;
  return this.save();
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
 * Create or update multiple lists with raw data
 */
ListSchema.statics.createOrUpdateLists = function (board, newLists) {
  return this.findByBoardId(board.id)
    .then(lists => {
      let promises = [];

      newLists.forEach((nl, i) => {
        nl.text = nl.text || `List ${i + 1}`;
        nl.index = i;
      });

      // Find match by name
      lists.forEach((list, i) => {
        let pos = newLists.findIndex(l => DataUtils.namesMatch(l.text, list.name));
        if (pos !== -1) {
          promises.push(list.updateWithData(newLists[pos], i));
          newLists.splice(pos, 1);
          list.found = true;
        }
      });

      // Find match by position
      lists.forEach((list, i) => {
        if (!list.found) {
          let pos = newLists.findIndex(l => l.index === i);
          if (pos !== -1) {
            promises.push(list.updateWithData(newLists[pos], i));
            newLists.splice(pos, 1);
          }
        }
      });

      // Add new lists
      newLists.forEach((nl, i) => {
        let list = new List();
        list.board = board.id;
        list.name = nl.text;
        list.position = lists.length + i;
        list.tasks = nl.tasks;
        list.skip_position_validation = true;
        promises.push(list.save());
      });

      return Promise.all(promises);
    })
    .then(lists => {
      let data = {};
      data.tasks = [];
      lists.forEach(list => {
        list.tasks.forEach(t => t.list = list.id);
        data.tasks = data.tasks.concat(list.tasks);
      });
      data.lists = lists;
      return data;
    });
};

/**
 * [Pre Save Hook]
 * Validate that the position is between 0 and the count of lists in the board
 */
ListSchema.pre('save', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
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
  if (this.skip_position_validation) {
    return next();
  }
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
  if (this.skip_position_validation) {
    return next();
  }
  let updateQuery = {
    board: this.board
  };
  ModelUtils.updatePositions(List, this.position, -1, updateQuery)
    .then(() => next())
    .catch(next);
});

const List = mongoose.model('lists', ListSchema);
module.exports = List;