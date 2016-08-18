const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
const Board = require('models/board.model');
const User = require('models/user.model');
const BoardErrors = require('errors/board.errors');
const UserErrors = require('errors/user.errors');
const TestUtils  = require('../test.utils');

describe('Board Model', () => {
  // Mock DataBase
  beforeAll(TestUtils.mockDb);

  beforeEach(done => mockgoose.reset(() => done()));

  let board;
  let createBoard = (props = {}) => {
    const defaults = {
      name: 'Test Board',
      user: new User()
    };
    board = new Board(Object.assign(defaults, props));
    return board.save();
  };

  // Ensure board is cleaned after each test
  afterEach(() => board = undefined);

  describe('Constructor', () => {
    it('should create a board with defaults', done => {
      createBoard()
        .then(() => {
          expect(board.id).toBe(board._id.toString());
          expect(board.user).toBeDefined();
          expect(board.name).toBe('Test Board');
          expect(board.created_at).toEqual(jasmine.any(Date));
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should fail if the board doesn\'t have a name', done => {
      let data = {
        name: null
      };
      createBoard(data)
        .catch(err => {
          expect(err.errors.name.message).toBe('Path `name` is required.');
          done();
        });
    });

    it('should fail if the board doesn\'t have an user', done => {
      let data = {
        user: null
      };
      createBoard(data)
        .catch(err => {
          expect(err.errors.user.message).toBe('Path `user` is required.');
          done();
        });
    });
  });
  
  describe('findByUserId', () => {
    let user1, user2;

    beforeEach(done => {
      user1 = new User({
        _id: new mongoose.Types.ObjectId()
      });
      user2 = new User({
        _id: new mongoose.Types.ObjectId()
      });
      let promises = [
        createBoard({ name: 'Board 1', user: user1 }),
        createBoard({ name: 'Board 2', user: user1 }),
        createBoard({ name: 'Board 3', user: user2 })
      ];
      Promise.all(promises)
        .then(done);
    });

    it('should find all the boards that belongs to an user', done => {
      Board.findByUserId(user1._id)
        .then(boards => {
          expect(boards.length).toBe(2);
          let boardNames = boards.map(board => board.name);
          expect(boardNames.includes('Board 1')).toBe(true);
          expect(boardNames.includes('Board 2')).toBe(true);
          expect(boardNames.includes('Board 3')).toBe(false);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should return an empty array if the user doesn\'t have boards', done => {
      let userId = new mongoose.Types.ObjectId();
      Board.findByUserId(userId)
        .then(boards => {
          expect(boards.length).toBe(0);
          done();
        })
        .catch(err => done.fail(err));
    });
  });

  describe('verifyPermissions', () => {
    let user;

    beforeEach(done => {
      user = new User();
      createBoard({ user })
        .then(done);
    });

    it('should return the matching board', done => {
      Board.verifyPermissions(board.id, user.id)
        .then(data => {
          expect(data.board).toBeDefined();
          expect(data.board.id).toEqual(board.id);
          expect(data.board.user.toString()).toEqual(user.id);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should throw an error if the board id doesn\'t exist', done => {
      let boardId = new mongoose.Types.ObjectId();
      Board.verifyPermissions(boardId, user.id)
        .catch(err => {
          expect(err instanceof BoardErrors.BoardNotFoundError).toBe(true);
          done();
        });
    });

    it('should throw an error if the user can\'t use the board', done => {
      let userId = new mongoose.Types.ObjectId();
      Board.verifyPermissions(board.id, userId)
        .catch(err => {
          expect(err instanceof UserErrors.UnauthorizedUserError).toBe(true);
          done();
        });
    });
  });
});