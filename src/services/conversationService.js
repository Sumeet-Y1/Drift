const prisma = require('../config/db');
const { getDownloadUrl } = require('./uploadService');

async function attachFileUrl(message) {
  if (message.fileKey) {
    const fileUrl = await getDownloadUrl(message.fileKey);
    return { ...message, fileUrl };
  }
  return message;
}

async function attachFileUrls(messages) {
  return Promise.all(messages.map(attachFileUrl));
}

async function createOrGetConversation(userId, otherUserIds, name) {
  const allUserIds = Array.from(new Set([userId, ...otherUserIds]));

  if (allUserIds.length < 2) {
    const err = new Error('A conversation needs at least 2 participants');
    err.statusCode = 400;
    throw err;
  }

  const isGroup = allUserIds.length > 2;

  if (!isGroup) {
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: allUserIds.map((id) => ({
          members: { some: { userId: id } },
        })),
        members: { every: { userId: { in: allUserIds } } },
      },
      include: {
        members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
      },
    });

    if (existing) {
      return existing;
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup,
      name: isGroup ? name || null : null,
      members: {
        create: allUserIds.map((id) => ({ userId: id })),
      },
    },
    include: {
      members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
    },
  });

  return conversation;
}

async function listConversations(userId) {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        },
      },
    },
  });

  return memberships.map((m) => m.conversation);
}

async function assertMember(userId, conversationId) {
  const membership = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });

  if (!membership) {
    const err = new Error('Not a member of this conversation');
    err.statusCode = 403;
    throw err;
  }

  return membership;
}

async function getMessages(userId, conversationId, limit = 50) {
  await assertMember(userId, conversationId);

  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return attachFileUrls(messages);
}

async function createMessage(userId, conversationId, content, fileData) {
  await assertMember(userId, conversationId);

  const data = { content, authorId: userId, conversationId };

  if (fileData) {
    data.fileKey = fileData.fileKey;
    data.fileName = fileData.fileName;
    data.fileType = fileData.fileType;
  }

  const message = await prisma.directMessage.create({
    data,
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return attachFileUrl(message);
}

async function editMessage(userId, messageId, newContent) {
  const message = await prisma.directMessage.findUnique({ where: { id: messageId } });

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

  const updated = await prisma.directMessage.update({
    where: { id: messageId },
    data: { content: newContent, editedAt: new Date() },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return attachFileUrl(updated);
}

async function deleteMessage(userId, messageId) {
  const message = await prisma.directMessage.findUnique({ where: { id: messageId } });

  if (!message || message.deletedAt) {
    const err = new Error('Message not found');
    err.statusCode = 404;
    throw err;
  }

  if (message.authorId !== userId) {
    const err = new Error('You can only delete your own messages');
    err.statusCode = 403;
    throw err;
  }

  const deleted = await prisma.directMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: '[deleted]', fileKey: null, fileName: null, fileType: null },
  });

  return deleted;
}

module.exports = {
  createOrGetConversation,
  listConversations,
  assertMember,
  getMessages,
  createMessage,
  editMessage,
  deleteMessage,
};