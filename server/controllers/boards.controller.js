const path = require('path');
const formidable = require('formidable');
const Board = require('models/board.model');
const List = require('models/list.model');
const Task = require('models/task.model');
const PrintableUtils = require('utils/printable.utils');
const AIUtils = require('utils/ai.utils');
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
   * Get a PDF with the printable data of the board
   */
  exportPrintableBoard(req, res, next) {
    logger.debug(`Generating printable version of board "${req.board.name}"`);

    let data = {};
    let options = {};

    if (req.query && req.query.format) {
      options.format = req.query.format;
    }

    List.findByBoardId(req.board.id)
      .then(lists => {
        data.lists = lists;
        return Task.findByBoardId(req.board.id)
      })
      .then(tasks => {
        return PrintableUtils.generatePrintableBoard(req.board, data.lists, tasks, options);
      })
      .then(stream => {
        logger.info(`Printable version of board "${req.board.name}" generated`);
        if (options.format === 'html') {
          return res.send(stream);
        }
        stream.pipe(res);
      })
      .catch(err => next(new BoardErrors.UnknownBoardError(err.message || err)));
  },

  /**
   * Import a printed image of a board
   */
  importPrintableBoard(req, res, next) {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, field, file) => {
      if (err) {
        return next(new BoardErrors.UnknownBoardError(err.message || err));
      }
      if (!file || !file.image || !file.image.path) {
        return next(new BoardErrors.FieldRequiredError('Image'));
      }
      let data = {};
      AIUtils.updateBoard(req.board, file.image.path)
        .then(() => List.findByBoardId(req.board.id))
        .then(lists => {
          data.lists = lists.map(list => list.getReadableData());
          return Task.findByBoardId(req.board.id);
        })
        .then(tasks => {
          data.tasks = tasks.map(task => task.getReadableData());
          res.send(data);
        })
        .catch(err => next(new BoardErrors.UnknownBoardError(err.message || err)));
    });
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