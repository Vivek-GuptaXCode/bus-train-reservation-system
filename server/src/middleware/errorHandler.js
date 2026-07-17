// middleware/errorHandler.js
// Global error handler - catches all errors and sends a nice JSON response

const { AppError } = require('../shared/errors');

// this catches all errors and sends them as JSON
function errorHandler(err, req, res, next) {
  // Figure out what kind of error this is
  var statusCode;
  var code;
  var message;

  // Check if it's one of our application errors
  // If it is, we can use the details we put on it
  if (err.isAppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else {
    // Not our error - something unexpected happened
    // Don't leak internal details to the client
    statusCode = 500;
    code = 'INTERNAL_ERROR';
    message = 'An unexpected error occurred';

    // But DO log the full error so we can debug it
    console.error('--- UNHANDLED ERROR ---');
    console.error('Request ID:', req.requestId || 'N/A');
    console.error('Path:', req.method, req.originalUrl);
    console.error('Error:', err.stack || err.message || err);
    console.error('-----------------------');
  }

  // Send the error response as JSON
  // All errors follow this same format
  res.status(statusCode).json({
    success: false,
    error: {
      code: code,
      message: message,
    },
    meta: {
      requestId: req.requestId || null,
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = errorHandler;
