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

async function leaveServer(userId, serverId) {
  const server = await prisma.server.findUnique({ where: { id: serverId } });

  if (!server) {
    const err = new Error('Server not found');
    err.statusCode = 404;
    throw err;
  }

  if (server.ownerId === userId) {
    const err = new Error('Owner cannot leave their own server. Delete it instead.');
    err.statusCode = 400;
    throw err;
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId, serverId } },
  });

  if (!membership) {
    const err = new Error('Not a member of this server');
    err.statusCode = 403;
    throw err;
  }

  await prisma.membership.delete({
    where: { userId_serverId: { userId, serverId } },
  });

  return { message: 'Left server successfully' };
}

async function kickMember(requesterId, serverId, targetUserId) {
  const requesterMembership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId: requesterId, serverId } },
  });

  if (!requesterMembership || (requesterMembership.role !== 'OWNER' && requesterMembership.role !== 'ADMIN')) {
    const err = new Error('Only owners and admins can kick members');
    err.statusCode = 403;
    throw err;
  }

  const server = await prisma.server.findUnique({ where: { id: serverId } });

  if (targetUserId === server.ownerId) {
    const err = new Error('Cannot kick the server owner');
    err.statusCode = 400;
    throw err;
  }

  const targetMembership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId: targetUserId, serverId } },
  });

  if (!targetMembership) {
    const err = new Error('User is not a member of this server');
    err.statusCode = 404;
    throw err;
  }

  if (targetMembership.role === 'ADMIN' && requesterMembership.role !== 'OWNER') {
    const err = new Error('Only the owner can kick an admin');
    err.statusCode = 403;
    throw err;
  }

  await prisma.membership.delete({
    where: { userId_serverId: { userId: targetUserId, serverId } },
  });

  return { message: 'Member kicked successfully' };
}

async function deleteServer(userId, serverId) {
  const server = await prisma.server.findUnique({ where: { id: serverId } });

  if (!server) {
    const err = new Error('Server not found');
    err.statusCode = 404;
    throw err;
  }

  if (server.ownerId !== userId) {
    const err = new Error('Only the owner can delete this server');
    err.statusCode = 403;
    throw err;
  }

  await prisma.server.delete({ where: { id: serverId } });

  return { message: 'Server deleted successfully' };
}

module.exports = {
  createServer,
  joinServer,
  listUserServers,
  createChannel,
  listChannels,
  leaveServer,
  kickMember,
  deleteServer,
};