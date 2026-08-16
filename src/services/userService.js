const prisma = require('../config/db');
const { getDownloadUrl } = require('./uploadService');

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// avatarUrl can hold either a raw S3 key (self-uploaded avatars) or a full external URL
// (e.g. Google profile pictures). Only sign it if it looks like an S3 key.
async function resolveAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  return getDownloadUrl(avatarUrl);
}

async function setAvatar(userId, fileKey) {
  if (!fileKey.startsWith('uploads/' + userId + '/')) {
    const err = new Error('Invalid file reference');
    err.statusCode = 403;
    throw err;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: fileKey },
    select: { id: true, username: true, email: true, avatarUrl: true },
  });

  user.avatarUrl = await resolveAvatarUrl(user.avatarUrl);

  return user;
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true },
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  user.avatarUrl = await resolveAvatarUrl(user.avatarUrl);

  return user;
}

module.exports = { setAvatar, getProfile, ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE_BYTES };