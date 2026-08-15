const voiceService = require('../services/voiceService');

async function getVoiceTokenController(req, res) {
  const result = await voiceService.getVoiceToken(req.user.userId, req.user.username, req.params.channelId);
  res.status(200).json(result);
}

module.exports = { getVoiceTokenController };