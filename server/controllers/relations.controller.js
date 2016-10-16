const Relation = require('models/relation.model');
const Board = require('models/board.model');
const RelationErrors = require('errors/relation.errors');
const Logger = require('utils/logger');
const logger = new Logger('Relations Controller');

module.exports = {

  createRelation(req, res, next) {
    logger.debug('Creating relation with data:', req.body);

    let relation = new Relation({
      board: req.body.board
    });
    relation.setEditableData(req.body);
    return relation.save()
      .then(() => {
        logger.info(`Relation "${relation.name}" created`);
        res.send(relation.getReadableData());
      })
      .catch(err => next(err || new RelationErrors.UnknownRelationError()));
  },

  /**
   * Get data from a relation by ID
   */
  getRelationById(req, res) {
    res.send(req.relation.getReadableData());
  },

  /**
   * Update relation by ID
   */
  updateRelationById(req, res, next) {
    logger.debug('Updating relation with data:', req.body);

    req.relation.setEditableData(req.body);
    return req.relation.save()
      .then(() => {
        logger.info(`Relation "${req.relation.name}" updated`);
        res.send(req.relation.getReadableData());
      })
      .catch(err => next(err || new RelationErrors.UnknownRelationError()));
  },

  /**
   * Delete relation by ID
   */
  deleteRelationById(req, res, next) {
    logger.debug(`Deleting relation "${req.relation.name}"`);

    return req.relation.remove()
      .then(() => {
        logger.info(`Relation "${req.relation.name}" deleted`);
        res.status(204).end();
      })
      .catch(err => next(err || new RelationErrors.UnknownRelationError()));
  },

  /**
   * Verifies if the logged user has permissions to use the endpoint
   */
  verifyPermissions(req, res, next) {
    let boardId = req.body.board || req.query.board;
    let relationId = req.path.split('/')[1];
    let verifyPromise;

    // Verify relation and/or board permissions
    if (relationId) {
      verifyPromise = Relation.verifyPermissions(relationId, req.user.id);
    } else if (boardId) {
      verifyPromise = Board.verifyPermissions(boardId, req.user.id);
    } else {
      return next(new RelationErrors.UnknownRelationError());
    }

    verifyPromise
      .then(data => {
        req.board = data.board;
        req.relation = data.relation;
        next();
      })
      .catch(err => next(err || new RelationErrors.UnknownRelationError()));
  }

};