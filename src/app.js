require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { router: webhookRouter } = require('./routes/webhooks');

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(pinoHttp({ logger }));
app.use('/api/webhooks', webhookRouter);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'drift-server' });
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/servers', apiLimiter, require('./routes/servers'));
app.use('/api/channels', apiLimiter, require('./routes/channels'));
app.use('/api/conversations', apiLimiter, require('./routes/conversations'));
app.use('/api/voice', apiLimiter, require('./routes/voice'));
app.use('/api/uploads', apiLimiter, require('./routes/uploads'));
app.use('/api/users', apiLimiter, require('./routes/users'));

app.use(errorHandler);

module.exports = app;