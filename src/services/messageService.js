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

async function editMessage(userId, messageId, newContent) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message || message.deletedAt) {
    const err = new Error('Message not found');
    err.statusCode = 404;
    throw err;
  }

  if (message.authorId !== userId) {
    const err = new Error('You can only edit your own messages');
    err.statusCode = 403;
    throw err;
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: newContent, editedAt: new Date() },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return updated;
}

async function deleteMessage(userId, messageId) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });

  if (!message || message.deletedAt) {
    const err = new Error('Message not found');
    err.statusCode = 404;
    throw err;
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_serverId: { userId, serverId: message.channel.serverId } },
  });

  const isAuthor = message.authorId === userId;
  const isModerator = membership && (membership.role === 'OWNER' || membership.role === 'ADMIN');

  if (!isAuthor && !isModerator) {
    const err = new Error('You do not have permission to delete this message');
    err.statusCode = 403;
    throw err;
  }

  const deleted = await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: '[deleted]' },
  });

  return deleted;
}

module.exports = { getMessages, createMessage, editMessage, deleteMessage };