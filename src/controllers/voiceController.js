const voiceService = require('../services/voiceService');

async function getVoiceTokenController(req, res) {
  const result = await voiceService.getVoiceToken(req.user.userId, req.user.username, req.params.channelId);
  res.status(200).json(result);
}

async function muteParticipantController(req, res) {
  const result = await voiceService.muteParticipant(req.user.userId, req.params.channelId, req.params.userId);
  res.status(200).json(result);
}

async function disconnectParticipantController(req, res) {
  const result = await voiceService.disconnectParticipant(req.user.userId, req.params.channelId, req.params.userId);
  res.status(200).json(result);
}

module.exports = {
  getVoiceTokenController,
  muteParticipantController,
  disconnectParticipantController,
};