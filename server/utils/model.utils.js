const _ = require('lodash');
const Errors = require('errors/generic.errors');

module.exports = {

  /**
   * Validates that the position is in the accepted range
   *
   * @returns {Promise}
   */
  validatePosition(model, newPosition, oldPosition, isNew, countQuery) {
    // If the position is not changed, nothing to do
    if (!isNew && oldPosition === newPosition) {
      return Promise.resolve();
    }

    // Position should be positive
    if (newPosition < 0) {
      return Promise.reject(new Errors.InvalidRangeError('position'));
    }

    // Position can not be greater than the total
    return model.count(countQuery)
      .then(count => {
        let maxPosition = count;
        if (isNew) {
          maxPosition++;
        }
        if (newPosition >= maxPosition) {
          throw new Errors.InvalidRangeError('position');
        }
      })
  },

  /**
   * Updates the position of consecutive elements
   *
   * @returns {Promise}
   */
  updatePositions(model, newPosition, oldPosition, updateQuery) {
    let isNew = oldPosition === null || oldPosition === undefined;

    // If the position is not changed, nothing to do
    if (!isNew && oldPosition === newPosition) {
      return Promise.resolve();
    }

    let fromPosition;
    let toPosition;
    let inc;

    // Define position range to update
    if (!isNew) {
      if (oldPosition === -1) {
        fromPosition = newPosition;
        inc = -1;
      } else if (newPosition > oldPosition) {
        fromPosition = oldPosition;
        toPosition = newPosition;
        inc = -1;
      } else {
        fromPosition = newPosition;
        toPosition = oldPosition;
        inc = 1;
      }
    } else {
      fromPosition = newPosition;
      inc = 1;
    }

    let query = Object.assign({
      position: {
        $gte: fromPosition
      }
    }, updateQuery);
    let update = {
      $inc: {
        position: inc
      }
    };
    let options = {
      multi: true
    };
    if (toPosition) {
      query.position.$lte = toPosition;
    }

    return model.update(query, update, options);
  },

  equalIds(id1, id2) {
    return (id1 || '').toString() === (id2 || '').toString();
  }

};