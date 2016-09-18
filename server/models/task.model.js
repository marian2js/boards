const mongoose = require('mongoose');
const _ = require('lodash');
const List = require('models/list.model');
const ModelUtils = require('utils/model.utils');
const DataUtils = require('utils/data.utils');
const TaskErrors = require('errors/task.errors');

const TaskSchema = new mongoose.Schema({
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

TaskSchema
  .virtual('id')
  .get(function() {
    return this._id.toString();
  });

/**
 * Returns the data that can be sent to the client
 */
TaskSchema.methods.getReadableData = function () {
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
TaskSchema.methods.setEditableData = function (data) {
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
 * Update a task with raw data
 */
TaskSchema.methods.updateWithData = function (data, index) {
  if (!this.name && data.text) {
    this.name = data.text;
  }
  this.list = data.list;
  this.position = index;
  this.skip_position_validation = true;
  return this.save();
};

/**
 * Find the tasks of a board
 */
TaskSchema.statics.findByBoardId = function (boardId) {
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
 * Finds a task by ID only if the user has permissions to use it
 */
TaskSchema.statics.verifyPermissions = function (taskId, userId) {
  let data = {};
  return this.findById(taskId)
    .then(task => {
      if (!task) {
        throw new TaskErrors.TaskNotFoundError(taskId);
      }
      data.task = task;
      return List.verifyPermissions(task.list, userId);
    })
    .then(listData => Object.assign(data, listData));
};

/**
 * Create or update multiple tasks with raw data
 */
TaskSchema.statics.createOrUpdateTasks = function (board, newTasks) {
  return this.findByBoardId(board)
    .then(tasks => {
      let promises = [];

      // Filter tasks without name or list
      newTasks = newTasks.filter(t => t.text && t.list);

      // Find match by name
      tasks.forEach((task, i) => {
        let pos = newTasks.findIndex(l => DataUtils.namesMatch(l.text, task.name));
        if (pos !== -1) {
          promises.push(task.updateWithData(newTasks[pos], i));
          newTasks.splice(pos, 1);
          task.found = true;
        }
      });

      // Add new tasks
      newTasks.forEach((nt, i) => {
        let task = new Task();
        task.board = board.id;
        task.list = nt.list;
        task.name = nt.text;
        task.position = tasks.length + i;
        task.tasks = nt.tasks;
        task.skip_position_validation = true;
        promises.push(task.save());
      });

      return Promise.all(promises);
    });
};

/**
 * [Pre Save Hook]
 * Validate that the position is between 0 and the count of tasks in the list
 */
TaskSchema.pre('save', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  let countQuery = {
    list: this.list
  };
  let isNew = this.isNew || this.list.toString() !== this._oldList.toString();
  ModelUtils.validatePosition(Task, this.position, this._oldPosition, isNew, countQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Pre Save Hook]
 * Update the positions of the other tasks when a task is added or moved on the same list
 */
TaskSchema.pre('save', function (next) {
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
  ModelUtils.updatePositions(Task, this.position, this._oldPosition, updateQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Pre Save Hook]
 * Update the positions of the other tasks when a task is moved between lists
 */
TaskSchema.pre('save', function (next) {
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
  ModelUtils.updatePositions(Task, this._oldPosition, -1, updateQuery)
    .then(() => {
      updateQuery.list = this.list;

      // update positions on the new list
      return ModelUtils.updatePositions(Task, this.position, null, updateQuery);
    })
    .then(() => next())
    .catch(next);
});

/**
 * [Post Remove Hook]
 * Update the positions of the following tasks in the list
 */
TaskSchema.post('remove', function (next) {
  if (this.skip_position_validation) {
    return next();
  }
  let updateQuery = {
    list: this.list
  };
  ModelUtils.updatePositions(Task, this.position, -1, updateQuery)
    .then(() => next())
    .catch(next);
});

const Task = mongoose.model('tasks', TaskSchema);
module.exports = Task;