const prisma = require('../config/db');

async function getMessages(userId, channelId, limit = 50) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { server: true },
  });

  if (!channel) {
    const err = new Error('Channel not found');
    err.statusCode = 404;
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

  const messages = await prisma.message.findMany({
    where: { channelId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return messages;
}

async function createMessage(userId, channelId, content) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });

  if (!channel) {
    const err = new Error('Channel not found');
    err.statusCode = 404;
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

  const message = await prisma.message.create({
    data: { content, authorId: userId, channelId },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return message;
}

module.exports = { getMessages, createMessage };
