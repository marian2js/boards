const express = require('express');
const router = express.Router();
const listsController = require('controllers/lists.controller');

// Verify list permissions
router.use(listsController.verifyPermissions);

router.post('/', listsController.createList);

module.exports = router;