const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/token');

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

  const token = generateToken({ userId: user.id, username: user.username });

  return {
    token,
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

  const token = generateToken({ userId: user.id, username: user.username });

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email },
  };
}

module.exports = { signup, login };
