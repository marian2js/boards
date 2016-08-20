const mongoose = require('mongoose');
const _ = require('lodash');
const List = require('models/list.model');
const ModelUtils = require('utils/model.utils');
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
    required: true
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
 * [Pre Save Hook]
 * Validate that the position is between 0 and the count of tasks in the list
 */
TaskSchema.pre('save', function (next) {
  let countQuery = {
    list: this.list
  };
  ModelUtils.validatePosition(Task, this.position, this._oldPosition, countQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Pre Save Hook]
 * Update the positions of the tasks in the list
 */
TaskSchema.pre('save', function (next) {
  let updateQuery = {
    list: this.list
  };
  ModelUtils.updatePositions(Task, this.position, this._oldPosition, updateQuery)
    .then(() => next())
    .catch(next);
});

/**
 * [Post Remove Hook]
 * Update the positions of the following tasks in the list
 */
TaskSchema.post('remove', function (next) {
  let updateQuery = {
    list: this.list
  };
  ModelUtils.updatePositions(Task, this.position, -1, updateQuery)
    .then(() => next())
    .catch(next);
});

const Task = mongoose.model('tasks', TaskSchema);
module.exports = Task;