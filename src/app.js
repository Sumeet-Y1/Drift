require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'drift-server' });
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/servers', apiLimiter, require('./routes/servers'));
app.use('/api/channels', apiLimiter, require('./routes/channels'));
app.use('/api/conversations', apiLimiter, require('./routes/conversations'));
app.use('/api/voice', apiLimiter, require('./routes/voice'));
app.use('/api/uploads', apiLimiter, require('./routes/uploads'));

app.use(errorHandler);

module.exports = app;