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
    let item = req.item.getReadableData();
    let promise;
    if (req.item.link_relation) {
      promise = Relation.findById(req.item.link_relation)
        .then(relation => {
          item.link_relation = relation.getReadableData();
          let query = {
            $or: [{
              vertical_relation: item.link_relation.id
            }, {
              horizontal_relation: item.link_relation.id
            }]
          };
          return Item.find(query);
        })
        .then(items => {
          item.link_relation_items = items.map(item => item.getReadableData());
        });
    } else {
      promise = Promise.resolve();
    }
    promise.then(() => res.send(item));
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
    let verticalRelationId = req.body.vertical_relation || req.query.vertical_relation;
    let horizontalRelationId = req.body.horizontal_relation || req.query.horizontal_relation;
    let itemId = req.path.split('/')[1];
    let promises = [];
    let itemIndex, verticalRelationIndex, horizontalRelationIndex;

    // Verify item and/or relation permissions
    if (itemId) {
      itemIndex = promises.length;
      promises.push(Item.verifyPermissions(itemId, req.user.id));
    }
    if (verticalRelationId) {
      verticalRelationIndex = promises.length;
      promises.push(Relation.verifyPermissions(verticalRelationId, req.user.id, 'vertical_relation'));
    }
    if (horizontalRelationId) {
      horizontalRelationIndex = promises.length;
      promises.push(Relation.verifyPermissions(horizontalRelationId, req.user.id, 'horizontal_relation'));
    }

    if (!promises.length) {
      // Something is missing, throw the error
      return next(new ItemErrors.UnknownItemError());
    }

    Promise.all(promises)
      .then(data => {
        req.board = data.find(d => d.board).board;
        if (verticalRelationIndex !== undefined) {
          req.vertical_relation = data[verticalRelationIndex].relation;
        }
        if (horizontalRelationIndex !== undefined) {
          req.horizontal_relation = data[horizontalRelationIndex].relation;
        }
        if (itemIndex !== undefined) {
          req.item = data[itemIndex].item;
        }
        next();
      })
      .catch(err => next(err || new ItemErrors.UnknownItemError()));
  }

};