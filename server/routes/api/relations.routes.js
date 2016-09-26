const express = require('express');
const router = express.Router();
const relationsController = require('controllers/relations.controller');

// Verify relation permissions
router.use(relationsController.verifyPermissions);

router.get('/:relationId', relationsController.getRelationById);
router.put('/:relationId', relationsController.updateRelationById);
router.delete('/:relationId', relationsController.deleteRelationById);
router.post('/', relationsController.createRelation);

module.exports = router;