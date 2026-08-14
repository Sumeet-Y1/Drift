// Centralized error handler — with express-async-errors installed,
// any thrown error (including inside async functions) lands here.
function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
