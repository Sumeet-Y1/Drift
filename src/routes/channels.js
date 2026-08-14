const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getMessagesController } = require('../controllers/messageController');

router.use(authMiddleware);

router.get('/:channelId/messages', getMessagesController);

module.exports = router;
