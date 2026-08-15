const { AccessToken } = require('livekit-server-sdk');
const prisma = require('../config/db');

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

async function getVoiceToken(userId, username, channelId) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });

  if (!channel) {
    const err = new Error('Channel not found');
    err.statusCode = 404;
    throw err;
  }

  if (channel.type !== 'VOICE') {
    const err = new Error('This channel is not a voice channel');
    err.statusCode = 400;
    throw err;
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId, serverId: channel.serverId } },
  });

  if (!membership) {
    const err = new Error('Not a member of this server');
    err.statusCode = 403;
    throw err;
  }

  // LiveKit "room name" is just the channel ID — one room per voice channel
  const roomName = 'voice-' + channelId;

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: userId,
    name: username,
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const jwt = await token.toJwt();

  return { token: jwt, roomName, livekitUrl: process.env.LIVEKIT_URL };
}

module.exports = { getVoiceToken };