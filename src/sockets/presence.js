const prisma = require('../config/db');

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// userId -> { status: 'online' | 'idle' | 'offline', lastActive: Date, socketIds: Set<string> }
const presenceMap = new Map();

// userId -> NodeJS.Timeout (the idle timer)
const idleTimers = new Map();

function clearIdleTimer(userId) {
  const timer = idleTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    idleTimers.delete(userId);
  }
}

function scheduleIdleTimer(userId, onIdle) {
  clearIdleTimer(userId);
  const timer = setTimeout(() => {
    const entry = presenceMap.get(userId);
    if (entry && entry.status === 'online') {
      entry.status = 'idle';
      onIdle(userId);
    }
  }, IDLE_TIMEOUT_MS);
  idleTimers.set(userId, timer);
}

function markOnline(userId, socketId, onIdle) {
  let entry = presenceMap.get(userId);

  if (!entry) {
    entry = { status: 'online', lastActive: new Date(), socketIds: new Set() };
    presenceMap.set(userId, entry);
  } else {
    entry.status = 'online';
    entry.lastActive = new Date();
  }

  entry.socketIds.add(socketId);
  scheduleIdleTimer(userId, onIdle);

  return entry;
}

function markActivity(userId, onIdle) {
  const entry = presenceMap.get(userId);
  if (!entry) return;

  entry.lastActive = new Date();
  if (entry.status === 'idle') {
    entry.status = 'online';
  }
  scheduleIdleTimer(userId, onIdle);
}

function markOffline(userId, socketId) {
  const entry = presenceMap.get(userId);
  if (!entry) return null;

  entry.socketIds.delete(socketId);

  // Only go fully offline if this was their last connected socket
  // (they might have multiple tabs/devices open)
  if (entry.socketIds.size === 0) {
    entry.status = 'offline';
    clearIdleTimer(userId);
    presenceMap.delete(userId);
    return 'offline';
  }

  return null; // still has other active sockets, stays online
}

function getStatus(userId) {
  const entry = presenceMap.get(userId);
  return entry ? entry.status : 'offline';
}

// Find every other user who shares a server or DM conversation with this user —
// these are the people who should be notified when this user's status changes.
async function getRelevantUserIds(userId) {
  const [serverMemberships, conversationMemberships] = await Promise.all([
    prisma.membership.findMany({
      where: { userId },
      select: { serverId: true },
    }),
    prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    }),
  ]);

  const serverIds = serverMemberships.map((m) => m.serverId);
  const conversationIds = conversationMemberships.map((m) => m.conversationId);

  const [serverPeers, conversationPeers] = await Promise.all([
    prisma.membership.findMany({
      where: { serverId: { in: serverIds }, userId: { not: userId } },
      select: { userId: true },
    }),
    prisma.conversationMember.findMany({
      where: { conversationId: { in: conversationIds }, userId: { not: userId } },
      select: { userId: true },
    }),
  ]);

  const relevantIds = new Set([
    ...serverPeers.map((p) => p.userId),
    ...conversationPeers.map((p) => p.userId),
  ]);

  return Array.from(relevantIds);
}

module.exports = {
  markOnline,
  markActivity,
  markOffline,
  getStatus,
  getRelevantUserIds,
};