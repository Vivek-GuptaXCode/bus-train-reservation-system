// middleware/authenticate.js
// Checks if the user has a valid JWT token

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { unauthorized } = require('../shared/errors');

// checks JWT token in Authorization header
function authenticate(req, res, next) {
  // check if token is there
  var authHeader = req.headers.authorization;

  // No Authorization header at all
  if (!authHeader) {
    return next(unauthorized('Missing Authorization header'));
  }

  // Check if it's a Bearer token
  // Format should be: "Bearer <token>"
  var parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(unauthorized('Authorization header must be: Bearer <token>'));
  }

  var token = parts[1];

  // Verify the token
  try {
    var decoded = jwt.verify(token, config.JWT_SECRET);

    // Attach the decoded payload to the request
    // This will have user_id, role, email, etc.
    req.user = decoded;

    // Token is valid, let the request continue
    next();
  } catch (err) {
    // Token is expired, tampered with, or something else
    // Let's figure out what went wrong
    if (err.name === 'TokenExpiredError') {
      return next(unauthorized('Token has expired, please login again'));
    }
    return next(unauthorized('Invalid or expired token'));
  }
}

// Export both as default and named export
// Some files import like: const { authenticate } = require(...)
module.exports = authenticate;
module.exports.authenticate = authenticate;
