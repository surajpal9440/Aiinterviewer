/**
 * errorHandler.js — Global Express error handling middleware
 * Mirrors Java GlobalExceptionHandler.
 */

function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message
  });
}

module.exports = errorHandler;
