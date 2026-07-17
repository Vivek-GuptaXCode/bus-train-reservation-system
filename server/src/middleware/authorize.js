// middleware/authorize.js
// Checks if the authenticated user has the right role

const { forbidden } = require('../shared/errors');

/**
 * Authorization middleware factory.
 * Returns a middleware that checks if the user's role is one of the allowed ones.
 *
 * Usage:
 *   router.get('/admin-only', authorize(ROLES.ADMINISTRATOR), handler);
 *   router.get('/staff', authorize(ROLES.BOOKING_CLERK, ROLES.ADMINISTRATOR), handler);
 *
 * @param {...string} allowedRoles - The roles that are allowed to access this route
 * @returns {Function} Express middleware
 */
function authorize(...allowedRoles) {
  return function (req, res, next) {
    // Make sure the user is actually on the request (authenticate should run first)
    if (!req.user) {
      return next(forbidden('Authentication required before authorization'));
    }

    // Check if the user's role is in the list of allowed roles
    // Simple array check - nothing fancy
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        forbidden(
          'You do not have permission to perform this action. Required role: ' +
            allowedRoles.join(' or ')
        )
      );
    }

    // User has the right role, let them through
    next();
  };
}

module.exports = authorize;
