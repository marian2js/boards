const mongoose = require('mongoose');
const _ = require('lodash');
const List = require('models/list.model');
const ModelUtils = require('utils/model.utils');
const DataUtils = require('utils/data.utils');
const ItemErrors = require('errors/item.errors');

const ItemSchema = new mongoose.Schema({
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
    index: true
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true,

    // if the list is changed, keep track of the old list
    set: function(list) {
      this._oldList = this.list;
      return list;
    }
  },
  name: {
    type: String,
    required: true
  },
  description: String,
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

ItemSchema
  .virtual('id')
  .get(function() {
    return this._id.toString();
  });

/**
 * Returns the data that can be sent to the client
 */
ItemSchema.methods.getReadableData = function () {
  return {
    id: this.id,
    board: this.board,
    list: this.list,
    name: this.name,
    description: this.description,
    position: this.position,
    created_at: this.created_at
  };
};

/**
 * Sets only the data that can be edited by the users
 */
ItemSchema.methods.setEditableData = function (data) {
  let editableKeys = [
    'list',
    'name',
    'description',
    'position'
  ];
  let editableData = _.pick(data, editableKeys);
  _.forEach(editableData, (value, key) => {
    this[key] = value;
  });
};

/**
 * Update an item with raw data
 */
ItemSchema.methods.updateWithData = function (data, index) {
  if (!this.name && data.text) {
    this.name = data.text;
  }
  this.list = data.list;
  this.position = index;
  this.skip_position_validation = true;
  return this.save();
};

/**
 * Find the items of a board
 */
ItemSchema.statics.findByBoardId = function (boardId) {
  let query = {
    board: boardId
  };
  let options = {
    sort: {
      list: -1,
      position: 1
    }
  };
  return this.find(query, {}, options);
};

/**
 * Finds an item by ID only if the user has permissions to use it
 */
ItemSchema.statics.verifyPermissions = function (itemId, userId) {
  let data = {};
  return this.findById(itemId)
    .then(item => {
      if (!item) {
        throw new ItemErrors.ItemNotFoundError(itemId);
      }
      data.item = item;
      return List.verifyPermissions(item.list, userId);
    })
    .then(listData => Object.assign(data, listData));
};

/**
 * Create or update multiple items with raw data
 */
ItemSchema.statics.createOrUpdateItems = function (board, newItems) {
  return this.findByBoardId(board)
    .then(items => {
      let promises = [];

      // Filter items without name or list
      newItems = newItems.filter(t => t.text && t.list);

      // Find match by name
      items.forEach((item, i) => {
        let pos = newItems.findIndex(l => DataUtils.namesMatch(l.text, item.name));
        if (pos !== -1) {
          promises.push(item.updateWithData(newItems[pos], i));
          newItems.splice(pos, 1);
          item.found = true;
        }
      });

      // Add new items
      newItems.forEach((nt, i) => {
        let item = new Item();
        item.board = board.id;
        item.list = nt.list;
        item.name = nt.text;
        item.position = items.length + i;
        item.items = nt.items;
        item.skip_position_validation = true;
        promises.push(item.save());
      });

      return Promise.all(promises);
    });
};

/**
 * [Pre Save Hook]
 * Validate that the position is between 0 and the count of items in the list
 */
ItemSchema.pre('save', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  let countQuery = {
    list: this.list
  };
  let isNew = this.isNew || this.list.toString() !== this._oldList.toString();
  ModelUtils.validatePosition(Item, this.position, this._oldPosition, isNew, countQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Pre Save Hook]
 * Update the positions of the other items when an item is added or moved on the same list
 */
ItemSchema.pre('save', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  // If the change is between lists, nothing to do here
  if (!this.isNew && this.list.toString() !== this._oldList.toString()) {
    return next();
  }
  let updateQuery = {
    list: this.list
  };
  ModelUtils.updatePositions(Item, this.position, this._oldPosition, updateQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Pre Save Hook]
 * Update the positions of the other items when an item is moved between lists
 */
ItemSchema.pre('save', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  if (this.isNew || this.list.toString() === this._oldList.toString()) {
    return next();
  }

  let updateQuery = {
    _id: {
      $ne: this._id
    },
    list: this._oldList
  };
  if (_.isUndefined(this._oldPosition)) {
    this._oldPosition = this.position;
  }

  // update positions on the old list
  ModelUtils.updatePositions(Item, this._oldPosition, -1, updateQuery)
    .then(() => {
      updateQuery.list = this.list;

      // update positions on the new list
      return ModelUtils.updatePositions(Item, this.position, null, updateQuery);
    })
    .then(() => next())
    .catch(next);
});

/**
 * [Post Remove Hook]
 * Update the positions of the following items in the list
 */
ItemSchema.post('remove', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  let updateQuery = {
    list: this.list
  };
  ModelUtils.updatePositions(Item, this.position, -1, updateQuery)
    .then(() => next())
    .catch(next);
});

const Item = mongoose.model('items', ItemSchema);
module.exports = Item;