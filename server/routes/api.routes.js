const express = require('express');
const router = express.Router();
const userController = require('controllers/users.controller');

// Require authentication for accessing the API
router.use(userController.validateAuth);

router.use('/users', require('./api/users.routes'));
router.use('/boards', require('./api/boards.routes'));

module.exports = router;