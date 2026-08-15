const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getVoiceTokenController } = require('../controllers/voiceController');

router.use(authMiddleware);

router.get('/:channelId/token', getVoiceTokenController);

module.exports = router;