require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Global middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- Health check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'drift-server' });
});

// --- Routes (mounted as we build them) ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/servers', require('./routes/servers'));
// app.use('/api/channels', require('./routes/channels'));

// --- Error handler (must be last) ---
app.use(errorHandler);

module.exports = app;
