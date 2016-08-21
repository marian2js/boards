const List = require('models/list.model');
const Board = require('models/board.model');
const ListErrors = require('errors/list.errors');
const Logger = require('utils/logger');
const logger = new Logger('Lists Controller');

module.exports = {

  createList(req, res, next) {
    logger.debug('Creating list with data:', req.body);

    let list = new List({
      board: req.body.board
    });
    list.setEditableData(req.body);
    return list.save()
      .then(() => {
        logger.info(`List "${list.name}" created`);
        res.send(list.getReadableData());
      })
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
    logger.debug('Updating list with data:', req.body);

    req.list.setEditableData(req.body);
    return req.list.save()
      .then(() => {
        logger.info(`List "${req.list.name}" updated`);
        res.send(req.list.getReadableData());
      })
      .catch(err => next(new ListErrors.UnknownListError(err.message || err)));
  },

  /**
   * Delete list by ID
   */
  deleteListById(req, res, next) {
    logger.debug(`Deleting list "${req.list.name}"`);

    return req.list.remove()
      .then(() => {
        logger.info(`List "${req.list.name}" deleted`);
        res.status(204).end();
      })
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
      return next(new ListErrors.UnknownListError());
    }

    verifyPromise
      .then(data => {
        req.board = data.board;
        req.list = data.list;
        next();
      })
      .catch(err => next(err || new ListErrors.UnknownListError()));
  }

};