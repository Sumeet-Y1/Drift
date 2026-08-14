const prisma = require('../config/db');

async function createServer(userId, name) {
  const server = await prisma.server.create({
    data: {
      name,
      ownerId: userId,
      memberships: {
        create: { userId, role: 'OWNER' },
      },
      channels: {
        create: { name: 'general' },
      },
    },
    include: { channels: true },
  });

  return server;
}

async function joinServer(userId, inviteCode) {
  const server = await prisma.server.findUnique({ where: { inviteCode } });

  if (!server) {
    const err = new Error('Invalid invite code');
    err.statusCode = 404;
    throw err;
  }

  const existingMembership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId, serverId: server.id } },
  });

  if (existingMembership) {
    const err = new Error('Already a member of this server');
    err.statusCode = 409;
    throw err;
  }

  await prisma.membership.create({
    data: { userId, serverId: server.id, role: 'MEMBER' },
  });

  return server;
}

async function listUserServers(userId) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: {
      server: { include: { channels: true } },
    },
  });

  return memberships.map((m) => ({ ...m.server, role: m.role }));
}

async function createChannel(userId, serverId, name) {
  const membership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId, serverId } },
  });

  if (!membership) {
    const err = new Error('Not a member of this server');
    err.statusCode = 403;
    throw err;
  }

  const channel = await prisma.channel.create({
    data: { name, serverId },
  });

  return channel;
}

async function listChannels(userId, serverId) {
  const membership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId, serverId } },
  });

  if (!membership) {
    const err = new Error('Not a member of this server');
    err.statusCode = 403;
    throw err;
  }

  const channels = await prisma.channel.findMany({ where: { serverId } });
  return channels;
}

module.exports = {
  createServer,
  joinServer,
  listUserServers,
  createChannel,
  listChannels,
};
