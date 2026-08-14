const { PrismaClient } = require('@prisma/client');

// Singleton pattern — avoids creating multiple PrismaClient instances,
// which can exhaust database connections, especially with nodemon's hot reload.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
