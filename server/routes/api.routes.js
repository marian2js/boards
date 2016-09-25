const express = require('express');
const router = express.Router();
const userController = require('controllers/users.controller');

// Require authentication for accessing the API
router.use(userController.validateAuth);

router.use('/users', require('./api/users.routes'));
router.use('/boards', require('./api/boards.routes'));
router.use('/lists', require('./api/lists.routes'));
router.use('/items', require('./api/items.routes'));

module.exports = router;