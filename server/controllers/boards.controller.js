const Board = require('models/board.model');
const List = require('models/list.model');
const Task = require('models/task.model');
const BoardErrors = require('errors/board.errors');
const Logger = require('utils/logger');
const logger = new Logger('Boards Controller');

module.exports = {

  createBoard(req, res, next) {
    logger.debug('Creating board with data:', req.body);

    let board = new Board({
      user: req.user.id
    });
    board.setEditableData(req.body);
    return board.save()
      .then(() => {
        logger.info(`Board "${board.name}" created`);
        res.send(board.getReadableData());
      })
      .catch(err => next(new BoardErrors.UnknownBoardError(err.message || err)));
  },

  /**
   * Get data from a board by ID
   */
  getBoardById(req, res) {
    res.send(req.board.getReadableData());
  },

  /**
   * Update board by ID
   */
  updateBoardById(req, res, next) {
    logger.debug('Updating board with data:', req.body);

    req.board.setEditableData(req.body);
    return req.board.save()
      .then(() => {
        logger.info(`Board "${req.board.name}" updated`);
        res.send(req.board.getReadableData());
      })
      .catch(err => next(new BoardErrors.UnknownBoardError(err.message || err)));
  },

  /**
   * Get all the lists of a board
   */
  getBoardLists(req, res, next) {
    List.findByBoardId(req.board.id)
      .then(lists => {
        let listsData = lists.map(list => list.getReadableData());
        res.send(listsData);
      })
      .catch(err => next(new BoardErrors.UnknownBoardError(err.message || err)));
  },

  /**
   * Get all the tasks of a board
   */
  getBoardTasks(req, res, next) {
    Task.findByBoardId(req.board.id)
      .then(tasks => {
        let tasksData = tasks.map(list => list.getReadableData());
        res.send(tasksData);
      })
      .catch(err => next(new BoardErrors.UnknownBoardError(err.message || err)));
  },

  /**
   * Verifies if the logged user has permissions to use the endpoint
   */
  verifyPermissions(req, res, next) {
    let boardId = req.path.split('/')[1];
    if (!boardId) {
      return next();
    }
    Board.verifyPermissions(boardId, req.user.id)
      .then(data => {
        req.board = data.board;
        next();
      })
      .catch(err => next(err || new BoardErrors.UnknownBoardError()));
  }

};