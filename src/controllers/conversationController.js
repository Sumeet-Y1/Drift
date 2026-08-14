const conversationService = require('../services/conversationService');
const { createConversationSchema, sendMessageSchema } = require('../validators/conversationValidator');

async function createConversationController(req, res) {
  const parsed = createConversationSchema.parse(req.body);
  const otherUserIds = parsed.userIds.filter((id) => id !== req.user.userId);
  const conversation = await conversationService.createOrGetConversation(req.user.userId, otherUserIds, parsed.name);
  res.status(201).json(conversation);
}

async function listConversationsController(req, res) {
  const conversations = await conversationService.listConversations(req.user.userId);
  res.status(200).json(conversations);
}

async function getMessagesController(req, res) {
  const messages = await conversationService.getMessages(req.user.userId, req.params.conversationId);
  res.status(200).json(messages);
}

async function sendMessageController(req, res) {
  const parsed = sendMessageSchema.parse(req.body);
  const message = await conversationService.createMessage(req.user.userId, req.params.conversationId, parsed.content);
  res.status(201).json(message);
}

async function editMessageController(req, res) {
  const parsed = sendMessageSchema.parse(req.body);
  const message = await conversationService.editMessage(req.user.userId, req.params.messageId, parsed.content);
  res.status(200).json(message);
}

async function deleteMessageController(req, res) {
  const message = await conversationService.deleteMessage(req.user.userId, req.params.messageId);
  res.status(200).json(message);
}

module.exports = {
  createConversationController,
  listConversationsController,
  getMessagesController,
  sendMessageController,
  editMessageController,
  deleteMessageController,
};