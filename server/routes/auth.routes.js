const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/:provider', authController.authProvider);

router.get('/:provider/callback', authController.authProviderCallback);

module.exports = router;
