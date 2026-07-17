// middleware/validate.js
// Validates request data using Joi schemas

const { badRequest } = require('../shared/errors');

// validate function - uses Joi to check request data
function validate(schema, source) {
  // Default to validating the request body
  var dataSource = source || 'body';

  return function (req, res, next) {
    // Get the data from the right place
    var data = req[dataSource];

    // If there's nothing to validate, just skip
    if (!data) {
      return next(badRequest('No data provided in ' + dataSource));
    }

    // Run the validation
    var result = schema.validate(data, {
      abortEarly: false, // Get ALL errors, not just the first one
      stripUnknown: true, // Remove fields that aren't in the schema
    });

    // Check if validation failed
    if (result.error) {
      // Build a nice error message from all validation errors
      var messages = result.error.details.map(function (detail) {
        return detail.message;
      });

      return next(badRequest('Validation failed: ' + messages.join('; ')));
    }

    // Replace the data with the validated (and stripped) version
    req[dataSource] = result.value;

    next();
  };
}

module.exports = validate;
