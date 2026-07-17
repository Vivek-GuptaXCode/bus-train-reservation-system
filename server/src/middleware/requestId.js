// middleware/requestId.js
// Attaches a unique ID to every request for tracing

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware that gives each request a unique ID.
 * Useful for debugging - you can track a request through logs.
 */
function requestIdMiddleware(req, res, next) {
  // Generate a random UUID
  var requestId = uuidv4();

  // Stick it on the request object so handlers can use it
  req.requestId = requestId;

  // Also send it back to the client in the response header
  res.setHeader('X-Request-Id', requestId);

  // Move on to the next middleware
  next();
}

module.exports = requestIdMiddleware;
