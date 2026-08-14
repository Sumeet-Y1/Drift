const messageService = require('../services/messageService');

async function getMessagesController(req, res) {
  const messages = await messageService.getMessages(req.user.userId, req.params.channelId);
  res.status(200).json(messages);
}

async function editMessageController(req, res) {
  const { content } = req.body;
  const message = await messageService.editMessage(req.user.userId, req.params.messageId, content);
  res.status(200).json(message);
}

async function deleteMessageController(req, res) {
  const message = await messageService.deleteMessage(req.user.userId, req.params.messageId);
  res.status(200).json(message);
}

module.exports = { getMessagesController, editMessageController, deleteMessageController };