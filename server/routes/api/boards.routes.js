const express = require('express');
const router = express.Router();
const boardsController = require('controllers/boards.controller');

// Verify board permissions
router.use(boardsController.verifyPermissions);

router.get('/:boardId', boardsController.getBoardById);
router.put('/:boardId', boardsController.updateBoardById);
router.post('/', boardsController.createBoard);
router.get('/:boardId/relations', boardsController.getBoardRelations);
router.get('/:boardId/items', boardsController.getBoardItems);

router.get('/:boardId/export', boardsController.exportBoard);
router.post('/:boardId/import', boardsController.importBoard);

module.exports = router;