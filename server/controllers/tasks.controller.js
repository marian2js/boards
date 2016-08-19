const List = require('models/list.model');
const Task = require('models/task.model');
const TaskErrors = require('errors/task.errors');

module.exports = {

  createTask(req, res, next) {
    let task = new Task({
      board: req.board.id
    });
    task.setEditableData(req.body);
    return task.save()
      .then(() => res.send(task.getReadableData()))
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