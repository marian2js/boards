const express = require('express');
const router = express.Router();
const boardsController = require('controllers/boards.controller');

// Verify board permissions
router.use(boardsController.verifyPermissions);

router.get('/:boardId', boardsController.getBoardById);
router.put('/:boardId', boardsController.updateBoardById);
router.post('/', boardsController.createBoard);
router.get('/:boardId/lists', boardsController.getBoardLists);
router.get('/:boardId/tasks', boardsController.getBoardTasks);

router.get('/:boardId/export/printable', boardsController.exportPrintableBoard);
router.post('/:boardId/import/printable', boardsController.importPrintableBoard);

module.exports = router;