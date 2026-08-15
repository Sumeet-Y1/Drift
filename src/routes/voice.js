const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getVoiceTokenController,
  muteParticipantController,
  disconnectParticipantController,
} = require('../controllers/voiceController');

router.use(authMiddleware);

router.get('/:channelId/token', getVoiceTokenController);
router.post('/:channelId/mute/:userId', muteParticipantController);
router.post('/:channelId/disconnect/:userId', disconnectParticipantController);

module.exports = router;