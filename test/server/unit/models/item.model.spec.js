const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
const User = require('models/user.model');
const Board = require('models/board.model');
const Relation = require('models/relation.model');
const Item = require('models/item.model');
const ItemErrors = require('errors/item.errors');
const TestUtils  = require('../test.utils');

describe('Item Model', () => {
  // Mock DataBase
  beforeAll(TestUtils.mockDb);

  beforeEach(done => mockgoose.reset(() => done()));

  let item;
  let createItem = (props = {}) => {
    const defaults = {
      name: 'Test Item',
      board: new Board(),
      relation: new Relation(),
      position: 0
    };
    item = new Item(Object.assign(defaults, props));
    return item.save();
  };

  // Ensure item is cleaned after each test
  afterEach(() => item = undefined);

  describe('Constructor', () => {
    it('should create a item with defaults', done => {
      createItem()
        .then(() => {
          expect(item.id).toBe(item._id.toString());
          expect(item.board).toBeDefined();
          expect(item.relation).toBeDefined();
          expect(item.name).toBe('Test Item');
          expect(item.position).toBe(0);
          expect(item.created_at).toEqual(jasmine.any(Date));
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should fail if the item doesn\'t have a name', done => {
      let data = {
        name: null
      };
      createItem(data)
        .catch(err => {
          expect(err.errors.name.message).toBe('Path `name` is required.');
          done();
        });
    });

    it('should fail if the item doesn\'t have a board', done => {
      let data = {
        board: null
      };
      createItem(data)
        .catch(err => {
          expect(err.errors.board.message).toBe('Path `board` is required.');
          done();
        });
    });

    it('should fail if the item doesn\'t have a board', done => {
      let data = {
        relation: null
      };
      createItem(data)
        .catch(err => {
          expect(err.errors.relation.message).toBe('Path `relation` is required.');
          done();
        });
    });

    it('should fail if the item doesn\'t have a position', done => {
      let data = {
        position: null
      };
      createItem(data)
        .catch(err => {
          expect(err.errors.position.message).toBe('Path `position` is required.');
          done();
        });
    });
  });

  describe('findByBoardId', () => {
    let board1, board2;

    beforeEach(done => {
      board1 = new Board({
        _id: new mongoose.Types.ObjectId()
      });
      board2 = new Board({
        _id: new mongoose.Types.ObjectId()
      });
      let promises = [
        createItem({ name: 'Item 1', board: board1 }),
        createItem({ name: 'Item 2', board: board1 }),
        createItem({ name: 'Item 3', board: board2 })
      ];
      Promise.all(promises)
        .then(done);
    });

    it('should find all the items of one board', done => {
      Item.findByBoardId(board1._id)
        .then(items => {
          expect(items.length).toBe(2);
          let itemNames = items.map(item => item.name);
          expect(itemNames.includes('Item 1')).toBe(true);
          expect(itemNames.includes('Item 2')).toBe(true);
          expect(itemNames.includes('Item 3')).toBe(false);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should return an empty array if the board doesn\'t have items', done => {
      let boardId = new mongoose.Types.ObjectId();
      Item.findByBoardId(boardId)
        .then(items => {
          expect(items.length).toBe(0);
          done();
        })
        .catch(err => done.fail(err));
    });
  });

  describe('verifyPermissions', () => {
    let user;

    beforeEach(() => {
      spyOn(Relation, 'verifyPermissions').and.returnValue(Promise.resolve({}));
    });

    beforeEach(done => {
      user = new User();
      createItem({ user })
        .then(done);
    });

    it('should return the matching item', done => {
      Item.verifyPermissions(item.id, user.id)
        .then(data => {
          expect(data.item).toBeDefined();
          expect(data.item.id).toEqual(item.id);
          expect(Relation.verifyPermissions).toHaveBeenCalledWith(data.item.relation, user.id);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should throw an error if the item id doesn\'t exist', done => {
      let itemId = new mongoose.Types.ObjectId();
      Item.verifyPermissions(itemId, user.id)
        .catch(err => {
          expect(Relation.verifyPermissions).not.toHaveBeenCalled();
          expect(err instanceof ItemErrors.ItemNotFoundError).toBe(true);
          done();
        });
    });
  });
});