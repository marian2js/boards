const List = require('models/list.model');
const Board = require('models/board.model');
const ListErrors = require('errors/list.errors');

module.exports = {

  createList(req, res, next) {
    let list = new List({
      board: req.body.board
    });
    list.setEditableData(req.body);
    return list.save()
      .then(() => res.send(list.getReadableData()))
      .catch(err => next(new ListErrors.UnknownListError(err.message || err)));
  },

  /**
   * Get data from a list by ID
   */
  getListById(req, res) {
    res.send(req.list.getReadableData());
  },

  /**
   * Update list by ID
   */
  updateListById(req, res, next) {
    req.list.setEditableData(req.body);
    return req.list.save()
      .then(() => res.send(req.list.getReadableData()))
      .catch(err => next(new ListErrors.UnknownListError(err.message || err)));
  },

  /**
   * Delete list by ID
   */
  deleteListById(req, res, next) {
    return req.list.remove()
      .then(() => res.status(204).end())
      .catch(err => next(new ListErrors.UnknownListError(err.message || err)));
  },

  /**
   * Verifies if the logged user has permissions to use the endpoint
   */
  verifyPermissions(req, res, next) {
    let boardId = req.body.board || req.query.board;
    let listId = req.path.split('/')[1];
    let verifyPromise;

    // Verify list and/or board permissions
    if (listId) {
      verifyPromise = List.verifyPermissions(listId, req.user.id);
    } else if (boardId) {
      verifyPromise = Board.verifyPermissions(boardId, req.user.id);
    } else {
      return next();
    }

    verifyPromise
      .then(data => {
        req.board = data.board;
        req.list = data.list;
        next();
      })
      .catch(err => next(err || new ListErrors.UnknownBoardError()));
  }

};