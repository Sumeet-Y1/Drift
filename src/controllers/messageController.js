const messageService = require('../services/messageService');

async function getMessagesController(req, res) {
  const messages = await messageService.getMessages(req.user.userId, req.params.channelId);
  res.status(200).json(messages);
}

module.exports = { getMessagesController };
