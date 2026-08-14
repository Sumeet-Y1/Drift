const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getMessagesController,
  editMessageController,
  deleteMessageController,
} = require('../controllers/messageController');

router.use(authMiddleware);

router.get('/:channelId/messages', getMessagesController);
router.patch('/:channelId/messages/:messageId', editMessageController);
router.delete('/:channelId/messages/:messageId', deleteMessageController);

module.exports = router;