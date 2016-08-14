const express = require('express');
const router = express.Router();
const boardsController = require('controllers/boards.controller');

router.post('/', boardsController.createBoard);

module.exports = router;