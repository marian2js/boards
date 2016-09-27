const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
const User = require('models/user.model');
const Board = require('models/board.model');
const Relation = require('models/relation.model');
const RelationErrors = require('errors/relation.errors');
const TestUtils  = require('../test.utils');

describe('Relation Model', () => {
  // Mock DataBase
  beforeAll(TestUtils.mockDb);

  beforeEach(done => mockgoose.reset(() => done()));

  let relation;
  let createRelation = (props = {}) => {
    const defaults = {
      name: 'Test Relation',
      board: new Board(),
      position: 0
    };
    relation = new Relation(Object.assign(defaults, props));
    return relation.save();
  };

  // Ensure relation is cleaned after each test
  afterEach(() => relation = undefined);

  describe('Constructor', () => {
    it('should create a relation with defaults', done => {
      createRelation()
        .then(() => {
          expect(relation.id).toBe(relation._id.toString());
          expect(relation.board).toBeDefined();
          expect(relation.name).toBe('Test Relation');
          expect(relation.position).toBe(0);
          expect(relation.created_at).toEqual(jasmine.any(Date));
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should fail if the relation doesn\'t have a name', done => {
      let data = {
        name: null
      };
      createRelation(data)
        .catch(err => {
          expect(err.errors.name.message).toBe('Path `name` is required.');
          done();
        });
    });

    it('should fail if the relation doesn\'t have a board', done => {
      let data = {
        board: null
      };
      createRelation(data)
        .catch(err => {
          expect(err.errors.board.message).toBe('Path `board` is required.');
          done();
        });
    });

    it('should fail if the relation doesn\'t have a position', done => {
      let data = {
        position: null
      };
      createRelation(data)
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
        createRelation({ name: 'Relation 1', board: board1 }),
        createRelation({ name: 'Relation 2', board: board1 }),
        createRelation({ name: 'Relation 3', board: board2 })
      ];
      Promise.all(promises)
        .then(done);
    });

    it('should find all the relations of one board', done => {
      Relation.findByBoardId(board1._id)
        .then(relations => {
          expect(relations.length).toBe(2);
          let relationNames = relations.map(relation => relation.name);
          expect(relationNames.includes('Relation 1')).toBe(true);
          expect(relationNames.includes('Relation 2')).toBe(true);
          expect(relationNames.includes('Relation 3')).toBe(false);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should return an empty array if the board doesn\'t have relations', done => {
      let boardId = new mongoose.Types.ObjectId();
      Relation.findByBoardId(boardId)
        .then(relations => {
          expect(relations.length).toBe(0);
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
      createRelation({ user })
        .then(done);
    });

    it('should return the matching relation', done => {
      Relation.verifyPermissions(relation.id, user.id)
        .then(data => {
          expect(data.relation).toBeDefined();
          expect(data.relation.id).toEqual(relation.id);
          expect(Board.verifyPermissions).toHaveBeenCalledWith(data.relation.board, user.id);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should throw an error if the relation id doesn\'t exist', done => {
      let relationId = new mongoose.Types.ObjectId();
      Relation.verifyPermissions(relationId, user.id)
        .catch(err => {
          expect(Board.verifyPermissions).not.toHaveBeenCalled();
          expect(err instanceof RelationErrors.RelationNotFoundError).toBe(true);
          done();
        });
    });
  });
});