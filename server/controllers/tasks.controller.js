const List = require('models/list.model');
const Task = require('models/task.model');
const TaskErrors = require('errors/task.errors');
const Logger = require('utils/logger');
const logger = new Logger('Tasks Controller');

module.exports = {

  createTask(req, res, next) {
    logger.debug('Creating task with data:', req.body);

    let task = new Task({
      board: req.board.id
    });
    task.setEditableData(req.body);
    return task.save()
      .then(() => {
        logger.info(`Task ID "${task.id}" created`);
        res.send(task.getReadableData());
      })
      .catch(err => next(new TaskErrors.UnknownTaskError(err.message || err)));
  },

  /**
   * Get data from a task by ID
   */
  getTaskById(req, res) {
    res.send(req.task.getReadableData());
  },

  /**
   * Update task by ID
   */
  updateTaskById(req, res, next) {
    logger.debug('Updating task with data:', req.body);

    req.task.setEditableData(req.body);
    return req.task.save()
      .then(() => {
        logger.info(`Task ID "${req.task.id}" updated`);
        res.send(req.task.getReadableData());
      })
      .catch(err => next(new TaskErrors.UnknownTaskError(err.message || err)));
  },

  /**
   * Delete task by ID
   */
  deleteTaskById(req, res, next) {
    logger.debug(`Deleting task "${req.task.id}"`);

    return req.task.remove()
      .then(() => {
        logger.info(`Task ID "${req.task.id}" deleted`);
        res.status(204).end();
      })
      .catch(err => next(new TaskErrors.UnknownTaskError(err.message || err)));
  },

  /**
   * Verifies if the logged user has permissions to use the endpoint
   */
  verifyPermissions(req, res, next) {
    let listId = req.body.list || req.query.list;
    let taskId = req.path.split('/')[1];
    let verifyPromise;

    // Verify task and/or list permissions
    if (taskId) {
      verifyPromise = Task.verifyPermissions(taskId, req.user.id);
    } else if (listId) {
      verifyPromise = List.verifyPermissions(listId, req.user.id);
    } else {
      return next(new TaskErrors.UnknownTaskError());
    }

    verifyPromise
      .then(data => {
        req.board = data.board;
        req.list = data.list;
        req.task = data.task;
        next();
      })
      .catch(err => next(err || new TaskErrors.UnknownTaskError()));
  }

};