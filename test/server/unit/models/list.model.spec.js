const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
const User = require('models/user.model');
const Board = require('models/board.model');
const List = require('models/list.model');
const ListErrors = require('errors/list.errors');
const TestUtils  = require('../test.utils');

describe('List Model', () => {
  // Mock DataBase
  beforeAll(TestUtils.mockDb);

  beforeEach(done => mockgoose.reset(() => done()));

  let list;
  let createList = (props = {}) => {
    const defaults = {
      name: 'Test List',
      board: new Board(),
      position: 0
    };
    list = new List(Object.assign(defaults, props));
    return list.save();
  };

  // Ensure list is cleaned after each test
  afterEach(() => list = undefined);

  describe('Constructor', () => {
    it('should create a list with defaults', done => {
      createList()
        .then(() => {
          expect(list.id).toBe(list._id.toString());
          expect(list.board).toBeDefined();
          expect(list.name).toBe('Test List');
          expect(list.position).toBe(0);
          expect(list.created_at).toEqual(jasmine.any(Date));
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should fail if the list doesn\'t have a name', done => {
      let data = {
        name: null
      };
      createList(data)
        .catch(err => {
          expect(err.errors.name.message).toBe('Path `name` is required.');
          done();
        });
    });

    it('should fail if the list doesn\'t have a board', done => {
      let data = {
        board: null
      };
      createList(data)
        .catch(err => {
          expect(err.errors.board.message).toBe('Path `board` is required.');
          done();
        });
    });

    it('should fail if the list doesn\'t have a position', done => {
      let data = {
        position: null
      };
      createList(data)
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
        createList({ name: 'List 1', board: board1 }),
        createList({ name: 'List 2', board: board1 }),
        createList({ name: 'List 3', board: board2 })
      ];
      Promise.all(promises)
        .then(done);
    });

    it('should find all the lists of one board', done => {
      List.findByBoardId(board1._id)
        .then(lists => {
          expect(lists.length).toBe(2);
          let listNames = lists.map(list => list.name);
          expect(listNames.includes('List 1')).toBe(true);
          expect(listNames.includes('List 2')).toBe(true);
          expect(listNames.includes('List 3')).toBe(false);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should return an empty array if the board doesn\'t have lists', done => {
      let boardId = new mongoose.Types.ObjectId();
      List.findByBoardId(boardId)
        .then(lists => {
          expect(lists.length).toBe(0);
          done();
        })
        .catch(err => done.fail(err));
    });
  });

  describe('verifyPermissions', () => {
    let user;

    beforeEach(() => {
      spyOn(Board, 'verifyPermissions').and.returnValue(Promise.resolve({}));
    });

    beforeEach(done => {
      user = new User();
      createList({ user })
        .then(done);
    });

    it('should return the matching list', done => {
      List.verifyPermissions(list.id, user.id)
        .then(data => {
          expect(data.list).toBeDefined();
          expect(data.list.id).toEqual(list.id);
          expect(Board.verifyPermissions).toHaveBeenCalledWith(data.list.board, user.id);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should throw an error if the list id doesn\'t exist', done => {
      let listId = new mongoose.Types.ObjectId();
      List.verifyPermissions(listId, user.id)
        .catch(err => {
          expect(Board.verifyPermissions).not.toHaveBeenCalled();
          expect(err instanceof ListErrors.ListNotFoundError).toBe(true);
          done();
        });
    });
  });
});