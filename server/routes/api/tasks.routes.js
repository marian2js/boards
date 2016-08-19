const express = require('express');
const router = express.Router();
const tasksController = require('controllers/tasks.controller');

// Verify task permissions
router.use(tasksController.verifyPermissions);

router.post('/', tasksController.createTask);

module.exports = router;