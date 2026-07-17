// shared/errors.js
// Custom error classes for the API
// This way the error handler middleware can tell what went wrong
// got this pattern from a youtube tutorial

// Base application error class - extends built-in Error
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    // So we can check if an error is one of ours
    this.isAppError = true;
  }
}

// --- Factory functions for common HTTP errors ---

// 404 - Resource not found
function notFound(message) {
  return new AppError(message || 'Resource not found', 404, 'NOT_FOUND');
}

// 400 - Bad request (client sent something invalid)
function badRequest(message) {
  return new AppError(message || 'Bad request', 400, 'BAD_REQUEST');
}

// 403 - Forbidden (authenticated but not allowed)
function forbidden(message) {
  return new AppError(message || 'Forbidden', 403, 'FORBIDDEN');
}

// 401 - Unauthorized (not logged in or token invalid)
function unauthorized(message) {
  return new AppError(message || 'Unauthorized', 401, 'UNAUTHORIZED');
}

// 409 - Conflict (e.g., duplicate data, seat already booked)
function conflict(code, message) {
  return new AppError(message || 'Conflict', 409, code || 'CONFLICT');
}

// 500 - Internal server error (something broke on our side)
function internal(message) {
  return new AppError(message || 'Internal server error', 500, 'INTERNAL_ERROR');
}

module.exports = {
  AppError,
  notFound,
  badRequest,
  forbidden,
  unauthorized,
  conflict,
  internal,
};
