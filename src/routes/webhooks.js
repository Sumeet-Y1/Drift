const express = require('express');
const router = express.Router();
const { WebhookReceiver } = require('livekit-server-sdk');
const voicePresence = require('../services/voiceChannelPresenceService');

const receiver = new WebhookReceiver(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

let io; // injected from server.js so we can broadcast presence changes

function setSocketIO(ioInstance) {
  io = ioInstance;
}

// LiveKit sends raw bytes, not JSON — need the raw body, not express.json() parsed
router.post('/livekit', express.raw({ type: 'application/webhook+json' }), async (req, res) => {
  try {
    const event = await receiver.receive(req.body, req.get('Authorization'));

    const channelId = voicePresence.channelIdFromRoomName(event.room ? event.room.name : '');

    if (channelId && event.participant) {
      const userId = event.participant.identity;

      if (event.event === 'participant_joined') {
        voicePresence.addParticipant(channelId, userId);
      } else if (event.event === 'participant_left') {
        voicePresence.removeParticipant(channelId, userId);
      }

      if (io) {
        io.emit('voice_channel_update', {
          channelId,
          participants: voicePresence.getParticipants(channelId),
        });
      }
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    res.status(400).send('invalid webhook');
  }
});

module.exports = { router, setSocketIO };