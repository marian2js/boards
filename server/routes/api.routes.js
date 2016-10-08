const express = require('express');
const router = express.Router();
const userController = require('controllers/users.controller');

// Require authentication for accessing the API
router.use(userController.validateAuth);

router.use('/users', require('./api/users.routes'));
router.use('/teams', require('./api/teams.routes'));
router.use('/boards', require('./api/boards.routes'));
router.use('/relations', require('./api/relations.routes'));
router.use('/items', require('./api/items.routes'));

module.exports = router;