// db/pool.js
// Database connection pool using pg

const { Pool } = require('pg');
const config = require('../config/env');

// Create a new pool with the database URL from config
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  // TODO: add ssl config for production
});

// Log any errors from idle clients
// (errors on active queries are handled by the query callers)
pool.on('error', function (err) {
  console.error('Unexpected error on idle database client:', err.message);
  // Don't crash the server, just log it
});

/**
 * Helper to run a query with automatic client acquisition and release.
 * This is the main way to talk to the database.
 *
 * @param {string} text - The SQL query text
 * @param {Array} params - Query parameters for parameterized queries
 * @returns {Promise} Query result from pg
 */
async function query(text, params) {
  // Just delegate to the pool - pg handles everything
  var start = Date.now();
  try {
    var result = await pool.query(text, params);
    var duration = Date.now() - start;

    // Log slow queries to help with debugging
    if (duration > 1000) {
      console.warn('Slow query (' + duration + 'ms):', text.substring(0, 100));
    }

    return result;
  } catch (err) {
    // Add some context to the error
    console.error('Query error:', err.message);
    console.error('Query was:', text.substring(0, 200));
    throw err;
  }
}

// Also expose the raw pool in case someone needs it
// (for transactions etc.)
module.exports = pool;
module.exports.query = query;
