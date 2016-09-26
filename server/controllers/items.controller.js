const Relation = require('models/relation.model');
const Item = require('models/item.model');
const ItemErrors = require('errors/item.errors');
const Logger = require('utils/logger');
const logger = new Logger('Items Controller');

module.exports = {

  createItem(req, res, next) {
    logger.debug('Creating item with data:', req.body);

    let item = new Item({
      board: req.board.id
    });
    item.setEditableData(req.body);
    return item.save()
      .then(() => {
        logger.info(`Item ID "${item.id}" created`);
        res.send(item.getReadableData());
      })
      .catch(err => next(new ItemErrors.UnknownItemError(err.message || err)));
  },

  /**
   * Get data from an item by ID
   */
  getItemById(req, res) {
    res.send(req.item.getReadableData());
  },

  /**
   * Update item by ID
   */
  updateItemById(req, res, next) {
    logger.debug('Updating item with data:', req.body);

    req.item.setEditableData(req.body);
    return req.item.save()
      .then(() => {
        logger.info(`Item ID "${req.item.id}" updated`);
        res.send(req.item.getReadableData());
      })
      .catch(err => next(new ItemErrors.UnknownItemError(err.message || err)));
  },

  /**
   * Delete item by ID
   */
  deleteItemById(req, res, next) {
    logger.debug(`Deleting item "${req.item.id}"`);

    return req.item.remove()
      .then(() => {
        logger.info(`Item ID "${req.item.id}" deleted`);
        res.status(204).end();
      })
      .catch(err => next(new ItemErrors.UnknownItemError(err.message || err)));
  },

  /**
   * Verifies if the logged user has permissions to use the endpoint
   */
  verifyPermissions(req, res, next) {
    let relationId = req.body.relation || req.query.relation;
    let itemId = req.path.split('/')[1];
    let verifyPromise;

    // Verify item and/or relation permissions
    if (itemId) {
      verifyPromise = Item.verifyPermissions(itemId, req.user.id);
    } else if (relationId) {
      verifyPromise = Relation.verifyPermissions(relationId, req.user.id);
    } else {
      return next(new ItemErrors.UnknownItemError());
    }

    verifyPromise
      .then(data => {
        req.board = data.board;
        req.relation = data.relation;
        req.item = data.item;
        next();
      })
      .catch(err => next(err || new ItemErrors.UnknownItemError()));
  }

};