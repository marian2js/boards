const Board = require('models/board.model');
const BoardErrors = require('errors/board.errors');

module.exports = {

  createBoard(req, res, next) {
    let board = new Board({
      user: req.user.id
    });
    board.setEditableData(req.body);
    return board.save()
      .then(() => res.send(board.getReadableData()))
      .catch(err => next(new BoardErrors.UnknownBoardError(err.message || err)));
  }

};