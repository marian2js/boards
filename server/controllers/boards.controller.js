const Board = require('models/board.model');
const BoardErrors = require('errors/board.errors');
const UserErrors = require('errors/user.errors');

module.exports = {

  createBoard(req, res, next) {
    let board = new Board({
      user: req.user.id
    });
    board.setEditableData(req.body);
    return board.save()
      .then(() => res.send(board.getReadableData()))
      .catch(err => next(new BoardErrors.UnknownBoardError(err.message || err)));
  },

  /**
   * Get data from a board by ID
   */
  getBoardById(req, res) {
    res.send(req.board.getReadableData());
  },

  /**
   * Update board by ID
   */
  updateBoardById(req, res, next) {
    req.board.setEditableData(req.body);
    return req.user.save()
      .then(() => res.send(req.user.getReadableData()))
      .catch(err => next(new UserErrors.UnknownUserError(err.message || err)));
  },

  /**
   * Verifies if the logged user has permissions to use the endpoint
   */
  verifyPermissions(req, res, next) {
    let boardId = req.path.split('/')[1];
    if (!boardId) {
      return next();
    }
    Board.verifyPermissions(boardId, req.user.id)
      .then(data => {
        req.board = data.board;
        next();
      })
      .catch(err => next(err || new BoardErrors.UnknownBoardError()));
  }

};