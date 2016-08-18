const express = require('express');
const router = express.Router();
const listsController = require('controllers/lists.controller');

// Verify list permissions
router.use(listsController.verifyPermissions);

router.get('/:listId', listsController.getListById);
router.put('/:listId', listsController.updateListById);
router.delete('/:listId', listsController.deleteListById);
router.post('/', listsController.createList);

module.exports = router;