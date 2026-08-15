const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const {
  generateAccessToken,
  generateRefreshTokenString,
  getRefreshTokenExpiry,
} = require('../utils/token');

async function issueTokens(user) {
  const accessToken = generateAccessToken({ userId: user.id, username: user.username });

  const refreshToken = generateRefreshTokenString();
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken };
}

async function signup(username, email, password) {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    const err = new Error('Username or email already in use');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  const tokens = await issueTokens(user);

  return {
    ...tokens,
    user: { id: user.id, username: user.username, email: user.email },
  };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isValid = await comparePassword(password, user.passwordHash);

  if (!isValid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const tokens = await issueTokens(user);

  return {
    ...tokens,
    user: { id: user.id, username: user.username, email: user.email },
  };
}

async function refreshAccessToken(refreshTokenString) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenString },
    include: { user: true },
  });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = generateAccessToken({
    userId: storedToken.user.id,
    username: storedToken.user.username,
  });

  return { accessToken };
}

async function logout(refreshTokenString) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshTokenString },
    data: { revokedAt: new Date() },
  });

  return { message: 'Logged out successfully' };
}

module.exports = { signup, login, refreshAccessToken, logout };