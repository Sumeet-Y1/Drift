const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const {
  generateAccessToken,
  generateRefreshTokenString,
  getRefreshTokenExpiry,
} = require('../utils/token');
const { generateOtp, getOtpExpiry } = require('../utils/otp');
const { sendOtpEmail, sendPasswordResetEmail } = require('./emailService');

const OTP_EXPIRY_MINUTES = 10;
const PASSWORD_RESET_EXPIRY_MINUTES = 15;

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

async function requestSignupOtp(username, email, password) {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    const err = new Error('Username or email already in use');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const otpCode = generateOtp();
  const otpExpiresAt = getOtpExpiry(OTP_EXPIRY_MINUTES);

  // Upsert: if they requested an OTP before but never verified, overwrite with a fresh one
  await prisma.pendingSignup.upsert({
    where: { email },
    create: { username, email, passwordHash, otpCode, otpExpiresAt },
    update: { username, passwordHash, otpCode, otpExpiresAt },
  });

  await sendOtpEmail(email, otpCode);

  return { message: 'Verification code sent to your email' };
}

async function verifySignupOtp(email, otpCode) {
  const pending = await prisma.pendingSignup.findUnique({ where: { email } });

  if (!pending) {
    const err = new Error('No pending signup found for this email');
    err.statusCode = 404;
    throw err;
  }

  if (pending.otpExpiresAt < new Date()) {
    const err = new Error('Verification code has expired. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  if (pending.otpCode !== otpCode) {
    const err = new Error('Invalid verification code');
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.create({
    data: {
      username: pending.username,
      email: pending.email,
      passwordHash: pending.passwordHash,
    },
  });

  await prisma.pendingSignup.delete({ where: { email } });

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

async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberately don't reveal whether the email exists - prevents email enumeration
  if (!user) {
    return { message: 'If an account exists with this email, a reset code has been sent' };
  }

  const otpCode = generateOtp();
  const expiresAt = getOtpExpiry(PASSWORD_RESET_EXPIRY_MINUTES);

  await prisma.passwordReset.create({
    data: { userId: user.id, otpCode, expiresAt },
  });

  await sendPasswordResetEmail(email, otpCode);

  return { message: 'If an account exists with this email, a reset code has been sent' };
}

async function confirmPasswordReset(email, otpCode, newPassword) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error('Invalid or expired reset code');
    err.statusCode = 400;
    throw err;
  }

  const resetRequest = await prisma.passwordReset.findFirst({
    where: { userId: user.id, otpCode, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!resetRequest || resetRequest.expiresAt < new Date()) {
    const err = new Error('Invalid or expired reset code');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: resetRequest.id }, data: { usedAt: new Date() } }),
    // Revoke all existing refresh tokens on password change - forces re-login everywhere
    prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);

  return { message: 'Password reset successfully. Please log in with your new password.' };
}

module.exports = {
  requestSignupOtp,
  verifySignupOtp,
  login,
  refreshAccessToken,
  logout,
  requestPasswordReset,
  confirmPasswordReset,
};