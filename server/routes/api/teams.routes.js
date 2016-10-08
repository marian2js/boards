const express = require('express');
const router = express.Router();
const teamsController = require('controllers/teams.controller');

// Verify team permissions
router.use(teamsController.verifyPermissions);

router.get('/:teamId', teamsController.getTeamById);
router.put('/:teamId', teamsController.updateTeamById);
router.post('/', teamsController.createTeam);
router.post('/:teamId/add-user', teamsController.addUser);

module.exports = router;