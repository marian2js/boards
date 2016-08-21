const mongoose = require('mongoose');
const mockgoose = require('mockgoose');
const User = require('models/user.model');
const Board = require('models/board.model');
const List = require('models/list.model');
const Task = require('models/task.model');
const TaskErrors = require('errors/task.errors');
const TestUtils  = require('../test.utils');

describe('Task Model', () => {
  // Mock DataBase
  beforeAll(TestUtils.mockDb);

  beforeEach(done => mockgoose.reset(() => done()));

  let task;
  let createTask = (props = {}) => {
    const defaults = {
      name: 'Test Task',
      board: new Board(),
      list: new List(),
      position: 0
    };
    task = new Task(Object.assign(defaults, props));
    return task.save();
  };

  // Ensure task is cleaned after each test
  afterEach(() => task = undefined);

  describe('Constructor', () => {
    it('should create a task with defaults', done => {
      createTask()
        .then(() => {
          expect(task.id).toBe(task._id.toString());
          expect(task.board).toBeDefined();
          expect(task.list).toBeDefined();
          expect(task.name).toBe('Test Task');
          expect(task.position).toBe(0);
          expect(task.created_at).toEqual(jasmine.any(Date));
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should fail if the task doesn\'t have a name', done => {
      let data = {
        name: null
      };
      createTask(data)
        .catch(err => {
          expect(err.errors.name.message).toBe('Path `name` is required.');
          done();
        });
    });

    it('should fail if the task doesn\'t have a board', done => {
      let data = {
        board: null
      };
      createTask(data)
        .catch(err => {
          expect(err.errors.board.message).toBe('Path `board` is required.');
          done();
        });
    });

    it('should fail if the task doesn\'t have a board', done => {
      let data = {
        list: null
      };
      createTask(data)
        .catch(err => {
          expect(err.errors.list.message).toBe('Path `list` is required.');
          done();
        });
    });

    it('should fail if the task doesn\'t have a position', done => {
      let data = {
        position: null
      };
      createTask(data)
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
        createTask({ name: 'Task 1', board: board1 }),
        createTask({ name: 'Task 2', board: board1 }),
        createTask({ name: 'Task 3', board: board2 })
      ];
      Promise.all(promises)
        .then(done);
    });

    it('should find all the tasks of one board', done => {
      Task.findByBoardId(board1._id)
        .then(tasks => {
          expect(tasks.length).toBe(2);
          let taskNames = tasks.map(task => task.name);
          expect(taskNames.includes('Task 1')).toBe(true);
          expect(taskNames.includes('Task 2')).toBe(true);
          expect(taskNames.includes('Task 3')).toBe(false);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should return an empty array if the board doesn\'t have tasks', done => {
      let boardId = new mongoose.Types.ObjectId();
      Task.findByBoardId(boardId)
        .then(tasks => {
          expect(tasks.length).toBe(0);
          done();
        })
        .catch(err => done.fail(err));
    });
  });

  describe('verifyPermissions', () => {
    let user;

    beforeEach(() => {
      spyOn(List, 'verifyPermissions').and.returnValue(Promise.resolve({}));
    });

    beforeEach(done => {
      user = new User();
      createTask({ user })
        .then(done);
    });

    it('should return the matching task', done => {
      Task.verifyPermissions(task.id, user.id)
        .then(data => {
          expect(data.task).toBeDefined();
          expect(data.task.id).toEqual(task.id);
          expect(List.verifyPermissions).toHaveBeenCalledWith(data.task.list, user.id);
          done();
        })
        .catch(err => done.fail(err));
    });

    it('should throw an error if the task id doesn\'t exist', done => {
      let taskId = new mongoose.Types.ObjectId();
      Task.verifyPermissions(taskId, user.id)
        .catch(err => {
          expect(List.verifyPermissions).not.toHaveBeenCalled();
          expect(err instanceof TaskErrors.TaskNotFoundError).toBe(true);
          done();
        });
    });
  });
});