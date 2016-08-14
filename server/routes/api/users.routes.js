const express = require('express');
const router = express.Router();
const userController = require('controllers/users.controller');

// Require authentication for accessing the API
router.use(userController.verifyPermissions);

router.get('/:userId/request_access_token', userController.requestAccessToken);
router.get('/:userId', userController.getUserById);
router.put('/:userId', userController.updateUserById);
router.get('/:userId/boards', userController.getUserBoards);

module.exports = router;