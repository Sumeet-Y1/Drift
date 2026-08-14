const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createConversationController,
  listConversationsController,
  getMessagesController,
  sendMessageController,
  editMessageController,
  deleteMessageController,
} = require('../controllers/conversationController');

router.use(authMiddleware);

router.post('/', createConversationController);
router.get('/', listConversationsController);
router.get('/:conversationId/messages', getMessagesController);
router.post('/:conversationId/messages', sendMessageController);
router.patch('/:conversationId/messages/:messageId', editMessageController);
router.delete('/:conversationId/messages/:messageId', deleteMessageController);

module.exports = router;