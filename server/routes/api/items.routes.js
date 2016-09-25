const express = require('express');
const router = express.Router();
const itemsController = require('controllers/items.controller');

// Verify item permissions
router.use(itemsController.verifyPermissions);

router.get('/:itemId', itemsController.getItemById);
router.put('/:itemId', itemsController.updateItemById);
router.delete('/:itemId', itemsController.deleteItemById);
router.post('/', itemsController.createItem);

module.exports = router;