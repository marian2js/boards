const express = require('express');
const router = express.Router();
const tasksController = require('controllers/tasks.controller');

// Verify task permissions
router.use(tasksController.verifyPermissions);

router.get('/:taskId', tasksController.getTaskById);
router.put('/:taskId', tasksController.updateTaskById);
router.delete('/:taskId', tasksController.deleteTaskById);
router.post('/', tasksController.createTask);

module.exports = router;