const mongoose = require('mongoose');
const _ = require('lodash');
const Board = require('models/board.model');
const ModelUtils = require('utils/model.utils');
const DataUtils = require('utils/data.utils');
const RelationErrors = require('errors/relation.errors');

const RelationSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['vertical', 'horizontal'],
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

RelationSchema
  .virtual('id')
  .get(function() {
    return this._id.toString();
  });

/**
 * Returns the data that can be sent to the client
 */
RelationSchema.methods.getReadableData = function () {
  return {
    id: this.id,
    board: this.board,
    name: this.name,
    type: this.type,
    position: this.position,
    created_at: this.created_at
  };
};

/**
 * Sets only the data that can be edited by the users
 */
RelationSchema.methods.setEditableData = function (data) {
  let editableKeys = [
    'name',
    'type',
    'position'
  ];
  let editableData = _.pick(data, editableKeys);
  _.forEach(editableData, (value, key) => {
    this[key] = value;
  });
};

/**
 * Update a relation with raw data
 */
RelationSchema.methods.updateWithData = function (data) {
  if (!this.name && data.text) {
    this.name = data.text;
  }
  this.position = data.index;
  this.type = data.type;
  this.rid = data.id;
  this.skip_position_validation = true;
  return this.save();
};

/**
 * Find the relations of a board
 */
RelationSchema.statics.findByBoardId = function (boardId) {
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
 * Finds a relation by ID only if the user has permissions to use it
 */
RelationSchema.statics.verifyPermissions = function (relationId, userId) {
  let data = {};
  return this.findById(relationId)
    .then(relation => {
      if (!relation) {
        throw new RelationErrors.RelationNotFoundError(relationId);
      }
      data.relation = relation;
      return Board.verifyPermissions(relation.board, userId);
    })
    .then(board => Object.assign(data, board));
};

/**
 * Create or update multiple relations with raw data
 */
RelationSchema.statics.createOrUpdateRelations = function (board, newRelations) {
  return this.findByBoardId(board.id)
    .then(relations => {
      let promises = [];

      let relationsCount = {
        vertical: 0,
        horizontal: 0
      };
      newRelations.forEach((nrel) => {
        nrel.text = nrel.text || `Relation ${relationsCount[nrel.type] + 1}`;
        nrel.index = relationsCount[nrel.type];
        relationsCount[nrel.type]++;
      });

      // Find match by name
      relations.forEach(relation => {
        let pos = newRelations.findIndex(r => {
          return DataUtils.namesMatch(r.text, relation.name) && r.type === relation.type;
        });
        if (pos !== -1) {
          promises.push(relation.updateWithData(newRelations[pos]));
          newRelations.splice(pos, 1);
          relation.found = true;
        }
      });

      // Find match by position
      relations.forEach(relation => {
        if (!relation.found) {
          let pos = newRelations.findIndex(r => r.index === relation.position && r.type === relation.type);
          if (pos !== -1) {
            promises.push(relation.updateWithData(newRelations[pos]));
            newRelations.splice(pos, 1);
          }
        }
      });

      // Add new relations
      relationsCount = {
        vertical: 0,
        horizontal: 0
      };
      newRelations.forEach(nrel => {
        let relation = new Relation();
        relation.board = board.id;
        relation.name = nrel.text;
        relation.position = relations
            .filter(r => r.type === nrel.type).length + relationsCount[nrel.type];
        relation.type = nrel.type;
        relation.rid = nrel.id;
        relation.skip_position_validation = true;
        promises.push(relation.save());
        relationsCount[nrel.type]++;
      });

      return Promise.all(promises);
    });
};

/**
 * [Pre Validate Hook]
 * Set default position at the end
 */
RelationSchema.pre('validate', function (next) {
  if(this.isNew && !Number.isFinite(this.position)) {
    let query = {
      board: this.board,
      type: this.type
    };
    Relation.count(query)
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
 * Validate that the position is between 0 and the count of relations in the board
 */
RelationSchema.pre('save', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  let countQuery = {
    board: this.board,
    type: this.type
  };
  ModelUtils.validatePosition(Relation, this.position, this._oldPosition, this.isNew, countQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Pre Save Hook]
 * Update the positions of the relations in the board
 */
RelationSchema.pre('save', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  let updateQuery = {
    board: this.board,
    type: this.type
  };
  ModelUtils.updatePositions(Relation, this.position, this._oldPosition, updateQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Post Remove Hook]
 * Update the positions of the following relations in the board
 */
RelationSchema.post('remove', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  let updateQuery = {
    board: this.board,
    type: this.type
  };
  ModelUtils.updatePositions(Relation, this.position, -1, updateQuery)
    .then(() => next())
    .catch(next);
});

const Relation = mongoose.model('relations', RelationSchema);
module.exports = Relation;