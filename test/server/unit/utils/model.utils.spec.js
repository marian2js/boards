const ModelUtils = require('utils/model.utils');
const Errors = require('errors/generic.errors');

describe('Model Utils', () => {

  describe('validatePosition', () => {
    let model;

    beforeEach(() => {
      model = {
        count() {}
      };
    });

    let expectValidPosition = (newPosition, oldPosition, done) => {
      spyOn(model, 'count').and.returnValue(Promise.resolve(5));
      let isNew = oldPosition === undefined || oldPosition === null;
      ModelUtils.validatePosition(model, newPosition, oldPosition, isNew, { q: 1 })
        .then(() => {
          expect(model.count).toHaveBeenCalledWith({ q: 1 });
          done();
        })
        .catch(err => done.fail(err));
    };

    let expectRangeError = (newPosition, oldPosition, done) => {
      spyOn(model, 'count').and.returnValue(Promise.resolve(5));
      let isNew = oldPosition === undefined || oldPosition === null;
      ModelUtils.validatePosition(model, newPosition, oldPosition, isNew, { q: 1 })
        .catch(err => {
          expect(err instanceof Errors.InvalidRangeError).toBe(true);
          done();
        });
    };

    it('should success if a new element is at the beginning', done => {
      let newPosition = 0;
      expectValidPosition(newPosition, null, done);
    });

    it('should success if a new element is in the middle', done => {
      let newPosition = 3;
      expectValidPosition(newPosition, null, done);
    });

    it('should success if a new element is at the end', done => {
      let newPosition = 5;
      expectValidPosition(newPosition, null, done);
    });

    it('should success if an element is moved to the beginning', done => {
      let newPosition = 0;
      let oldPosition = 3;
      expectValidPosition(newPosition, oldPosition, done);
    });

    it('should success if an element is moved to the middle', done => {
      let newPosition = 3;
      let oldPosition = 5;
      expectValidPosition(newPosition, oldPosition, done);
    });

    it('should success if an element is moved to the end', done => {
      let newPosition = 4;
      let oldPosition = 2;
      expectValidPosition(newPosition, oldPosition, done);
    });

    it('should fail if a new element is negative', done => {
      let newPosition = -1;
      expectRangeError(newPosition, null, done);
    });

    it('should fail if an element is moved to a negative position', done => {
      let newPosition = -1;
      let oldPosition = 3;
      expectRangeError(newPosition, oldPosition, done);
    });

    it('should fail if a new element is above the count of elements', done => {
      let newPosition = 6;
      expectRangeError(newPosition, null, done);
    });

    it('should fail if an element is moved above the count of elements', done => {
      let newPosition = 5;
      let oldPosition = 3;
      expectRangeError(newPosition, oldPosition, done);
    });

    it('should success without counting if the new position is equal to the old position', done => {
      let newPosition = 3;
      let oldPosition = 3;
      spyOn(model, 'count').and.returnValue(Promise.resolve(5));
      ModelUtils.validatePosition(model, newPosition, oldPosition, false, { q: 1 })
        .then(() => {
          expect(model.count).not.toHaveBeenCalled();
          done();
        })
        .catch(err => done.fail(err));
    });
  });

  describe('updatePositions', () => {
    let model;

    beforeEach(() => {
      model = {
        update() {}
      };
      spyOn(model, 'update').and.returnValue(Promise.resolve());
    });

    let expectValidUpdate = (newPosition, oldPosition, inc, done) => {
      ModelUtils.updatePositions(model, newPosition, oldPosition)
        .then(() => {
          let from, to;
          if (!oldPosition || oldPosition === -1) {
            from = newPosition;
          } else {
            from = newPosition > oldPosition ? oldPosition : newPosition;
            to = newPosition > oldPosition ? newPosition : oldPosition;
          }
          let query = {
            position: {
              $gte: from
            }
          };
          if (to) {
            query.position.$lte = to;
          }
          expect(model.update).toHaveBeenCalledWith(query, {
            $inc: {
              position: inc
            }
          }, {
            multi: true
          });
          done();
        })
        .catch(err => done.fail(err));
    };

    it('should increment from 3 to the end', done => {
      let newPosition = 3;
      expectValidUpdate(newPosition, null, 1, done);
    });

    it('should increment from 2 to 4', done => {
      let newPosition = 2;
      let oldPosition = 4;
      expectValidUpdate(newPosition, oldPosition, 1, done);
    });

    it('should decrement from 3 to the beginning', done => {
      let newPosition = 3;
      let oldPosition = -1;
      expectValidUpdate(newPosition, oldPosition, -1, done);
    });

    it('should decrement from 4 to 2', done => {
      let newPosition = 4;
      let oldPosition = 2;
      expectValidUpdate(newPosition, oldPosition, -1, done);
    });
  });

});