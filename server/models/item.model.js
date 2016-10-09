const mongoose = require('mongoose');
const _ = require('lodash');
const Relation = require('models/relation.model');
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
  vertical_relation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Relation',

    // if the relation is changed, keep track of the old relation
    set: function(relation) {
      this._oldVerticalRelation = this.vertical_relation;
      return relation;
    }
  },
  horizontal_relation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Relation',

    // if the relation is changed, keep track of the old relation
    set: function(relation) {
      this._oldHorizontalRelation = this.horizontal_relation;
      return relation;
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
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }],
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
    vertical_relation: this.vertical_relation,
    horizontal_relation: this.horizontal_relation,
    name: this.name,
    description: this.description,
    position: this.position,
    assignees: this.assignees,
    created_at: this.created_at
  };
};

/**
 * Sets only the data that can be edited by the users
 */
ItemSchema.methods.setEditableData = function (data) {
  let editableKeys = [
    'vertical_relation',
    'horizontal_relation',
    'name',
    'description',
    'position',
    'assignees'
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
  this.vertical_relation = data.vertical_relation;
  this.horizontal_relation = data.horizontal_relation;
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
      vertical_relation: -1,
      horizontal_relation: -1,
      position: 1
    }
  };
  return this.find(query, {}, options);
};

/**
 * Finds an item by ID only if the user has permissions to use it
 */
ItemSchema.statics.verifyPermissions = function (itemId, userId, relationKey) {
  let data = {};
  return this.findById(itemId)
    .then(item => {
      if (!item) {
        throw new ItemErrors.ItemNotFoundError(itemId);
      }
      data.item = item;
      let relationId;
      if(relationKey) {
        relationId = item[relationKey];
      } else {
        relationId = item.vertical_relation || item.horizontal_relation;
      }
      return Relation.verifyPermissions(relationId, userId);
    })
    .then(relationData => Object.assign(data, relationData));
};

/**
 * Create or update multiple items with raw data
 */
ItemSchema.statics.createOrUpdateItems = function (board, relations, newItems) {
  return this.findByBoardId(board)
    .then(items => {
      let promises = [];

      // Filter items without name or relation
      newItems = newItems.filter(t => t.text && (t.vertical_relation || t.horizontal_relation));

      // Set relation IDs
      newItems.forEach(item => {
        if (item.vertical_relation) {
          item.vertical_relation = relations.find(r => r.rid === item.vertical_relation).id;
        }
        if (item.horizontal_relation) {
          item.horizontal_relation = relations.find(r => r.rid === item.horizontal_relation).id;
        }
      });

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
        item.vertical_relation = nt.vertical_relation;
        item.horizontal_relation = nt.horizontal_relation;
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
 * [Pre Validate Hook]
 * Set default position at the end
 */
ItemSchema.pre('validate', function (next) {
  if(this.isNew && !Number.isFinite(this.position)) {
    let query = {
      board: this.board
    };
    if (this.vertical_relation) {
      query.vertical_relation = this.vertical_relation;
    }
    if (this.horizontal_relation) {
      query.horizontal_relation = this.horizontal_relation;
    }
    Item.count(query)
      .then(count => {
        this.position = count || 0;
        next();
      });
  } else {
    next();
  }
});

/**
 * [Pre Save Hook]
 * Validate that the position is between 0 and the count of items in the relation
 */
ItemSchema.pre('save', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  let countQuery = {};
  if (this.vertical_relation) {
    countQuery.vertical_relation = this.vertical_relation;
  }
  if (this.horizontal_relation) {
    countQuery.horizontal_relation = this.horizontal_relation;
  }
  let vRelationChanged = !ModelUtils.equalIds(this.vertical_relation, this._oldVerticalRelation);
  let hRelationChanged = !ModelUtils.equalIds(this.horizontal_relation, this._oldHorizontalRelation);
  let isNew = this.isNew || vRelationChanged || hRelationChanged;
  ModelUtils.validatePosition(Item, this.position, this._oldPosition, isNew, countQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Pre Save Hook]
 * Update the positions of the other items when an item is added or moved on the same relation
 */
ItemSchema.pre('save', function (next) {
  if (this.skip_position_validation) {
    return next();
  }

  // If the change is between relations, nothing to do here
  let vRelationChanged = !ModelUtils.equalIds(this.vertical_relation, this._oldVerticalRelation);
  let hRelationChanged = !ModelUtils.equalIds(this.horizontal_relation, this._oldHorizontalRelation);
  if (!this.isNew && (vRelationChanged || hRelationChanged)) {
    return next();
  }

  let updateQuery = {};
  if (this.vertical_relation) {
    updateQuery.vertical_relation = this.vertical_relation;
  }
  if (this.horizontal_relation) {
    updateQuery.horizontal_relation = this.horizontal_relation;
  }
  ModelUtils.updatePositions(Item, this.position, this._oldPosition, updateQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Pre Save Hook]
 * Update the positions of the other items when an item is moved between relations
 */
ItemSchema.pre('save', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  let vRelationChanged = !ModelUtils.equalIds(this.vertical_relation, this._oldVerticalRelation);
  let hRelationChanged = !ModelUtils.equalIds(this.horizontal_relation, this._oldHorizontalRelation);
  if (this.isNew || (!vRelationChanged && !hRelationChanged)) {
    return next();
  }

  let updateQuery = {
    _id: {
      $ne: this._id
    }
  };
  if (this._oldVerticalRelation) {
    updateQuery.vertical_relation = this._oldVerticalRelation;
  }
  if (this._oldHorizontalRelation) {
    updateQuery.horizontal_relation = this._oldHorizontalRelation;
  }
  if (_.isUndefined(this._oldPosition)) {
    this._oldPosition = this.position;
  }

  // update positions on the old relation
  ModelUtils.updatePositions(Item, this._oldPosition, -1, updateQuery)
    .then(() => {
      if (this.vertical_relation) {
        updateQuery.vertical_relation = this.vertical_relation;
      }
      if (this.horizontal_relation) {
        updateQuery.horizontal_relation = this.horizontal_relation;
      }

      // update positions on the new relation
      return ModelUtils.updatePositions(Item, this.position, null, updateQuery);
    })
    .then(() => next())
    .catch(next);
});

/**
 * [Post Remove Hook]
 * Update the positions of the following items in the relation
 */
ItemSchema.post('remove', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  let updateQuery = {};
  if (this.vertical_relation) {
    updateQuery.vertical_relation = this.vertical_relation;
  }
  if (this.horizontal_relation) {
    updateQuery.horizontal_relation = this.horizontal_relation;
  }
  ModelUtils.updatePositions(Item, this.position, -1, updateQuery)
    .then(() => next())
    .catch(next);
});

const Item = mongoose.model('items', ItemSchema);
module.exports = Item;