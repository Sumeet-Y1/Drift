const { AccessToken, RoomServiceClient, TrackType } = require('livekit-server-sdk');
const prisma = require('../config/db');

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

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

  return { token: jwt, roomName, livekitUrl: LIVEKIT_URL };
}

async function assertModerator(requesterId, serverId) {
  const membership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId: requesterId, serverId } },
  });

  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    const err = new Error('Only owners and admins can moderate voice channels');
    err.statusCode = 403;
    throw err;
  }
}

async function muteParticipant(requesterId, channelId, targetUserId) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });

  if (!channel || channel.type !== 'VOICE') {
    const err = new Error('Voice channel not found');
    err.statusCode = 404;
    throw err;
  }

  await assertModerator(requesterId, channel.serverId);

  const roomName = 'voice-' + channelId;

  const participants = await roomService.listParticipants(roomName);
  const target = participants.find((p) => p.identity === targetUserId);

  if (!target) {
    const err = new Error('User is not currently in this voice channel');
    err.statusCode = 404;
    throw err;
  }

  const audioTrack = target.tracks.find((t) => t.type === TrackType.AUDIO);

  if (!audioTrack) {
    const err = new Error('This participant has no active microphone track');
    err.statusCode = 404;
    throw err;
  }

  await roomService.mutePublishedTrack(roomName, targetUserId, audioTrack.sid, true);

  return { message: 'Participant muted' };
}

async function disconnectParticipant(requesterId, channelId, targetUserId) {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });

  if (!channel || channel.type !== 'VOICE') {
    const err = new Error('Voice channel not found');
    err.statusCode = 404;
    throw err;
  }

  await assertModerator(requesterId, channel.serverId);

  const roomName = 'voice-' + channelId;

  await roomService.removeParticipant(roomName, targetUserId);

  return { message: 'Participant disconnected from voice channel' };
}

module.exports = { getVoiceToken, muteParticipant, disconnectParticipant };