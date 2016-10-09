const path = require('path');
const formidable = require('formidable');
const Board = require('models/board.model');
const Relation = require('models/relation.model');
const Item = require('models/item.model');
const Team = require('models/team.model');
const User = require('models/user.model');
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
    let boardData = req.board.getReadableData();
    let promise;
    if (req.board.team) {
      promise = Team.findById(req.board.team)
        .then(team => {
          if (!team) {
            return;
          }
          boardData.team = team.getReadableData();
          let query = {
            _id: {
              $in: team.users.map(u => u.user)
            }
          };
          return User.find(query);
        })
        .then(users => {
          if (!users) {
            return;
          }
          boardData.team.users = boardData.team.users
            .map(user => {
              let teamUser = user.toObject();
              let userData = users.find(u => user.user.toString() === u._id.toString());
              if (userData) {
                teamUser.user = userData.getReadableData();
              }
              return teamUser;
            });
        });
    } else {
      promise = Promise.resolve();
    }
    promise.then(() => res.send(boardData));
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
   * Get all the relations of a board
   */
  getBoardRelations(req, res, next) {
    Relation.findByBoardId(req.board.id)
      .then(relations => {
        let relationsData = relations.map(relation => relation.getReadableData());
        res.send(relationsData);
      })
      .catch(err => next(new BoardErrors.UnknownBoardError(err.message || err)));
  },

  /**
   * Get all the items of a board
   */
  getBoardItems(req, res, next) {
    Item.findByBoardId(req.board.id)
      .then(items => {
        let itemsData = items.map(relation => relation.getReadableData());
        res.send(itemsData);
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

    Relation.findByBoardId(req.board.id)
      .then(relations => {
        data.relations = relations;
        return Item.findByBoardId(req.board.id)
      })
      .then(items => {
        data.items = items;
        if (req.board.team) {
          return Team.findById(req.board.team);
        }
      })
      .then(team => {
        return PrintableUtils.generatePrintableBoard(req.board, data.relations, data.items, team, options);
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
    logger.debug(`Importing image of board "${req.board.name}"`);

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
        .then(() => Relation.findByBoardId(req.board.id))
        .then(relations => {
          data.relations = relations.map(relation => relation.getReadableData());
          return Item.findByBoardId(req.board.id);
        })
        .then(items => {
          data.items = items.map(item => item.getReadableData());
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