const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
const Board = require('models/board.model');
const User = require('models/user.model');
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
});