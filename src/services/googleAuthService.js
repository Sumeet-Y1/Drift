const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/db');
const {
  generateAccessToken,
  generateRefreshTokenString,
  getRefreshTokenExpiry,
} = require('../utils/token');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

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

function generateUsernameFromEmail(email) {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return (base.slice(0, 15) + suffix).slice(0, 20);
}

async function loginWithGoogle(idToken) {
  let payload;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    const error = new Error('Invalid Google token');
    error.statusCode = 401;
    throw error;
  }

  const googleId = payload.sub;
  const email = payload.email;
  const emailVerified = payload.email_verified;

  if (!emailVerified) {
    const err = new Error('Google email is not verified');
    err.statusCode = 401;
    throw err;
  }

  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    // No user linked to this googleId yet - check if the email matches an existing account
    user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Link the existing account to this Google identity
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    } else {
      // Brand new user - auto-create, no OTP needed since Google already verified the email
      let username = generateUsernameFromEmail(email);

      // Extremely unlikely collision, but guard against it anyway
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        username = generateUsernameFromEmail(email);
      }

      user = await prisma.user.create({
        data: {
          username,
          email,
          googleId,
          avatarUrl: payload.picture || null,
        },
      });
    }
  }

  const tokens = await issueTokens(user);

  return {
    ...tokens,
    user: { id: user.id, username: user.username, email: user.email },
  };
}

module.exports = { loginWithGoogle };