// db/pool.js
// Database connection pool using pg

const { Pool } = require('pg');
const config = require('../config/env');

  // Create a new Postgres conncetion pool with the database URL from config
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  // TODO: add ssl config for production
  // FIXME: this might break if DATABASE_URL has special chars
});

// Log any errors from idle clients
// (errors on active queries are handled by the query callers)
pool.on('error', function (err) {
  console.error('Unexpected error on idle database client:', err.message);
  // Don't crash the server, just log it
});

// save the original pg query function
const originalQuery = pool.query.bind(pool);

// helper to run a query - this is the main way to talk to the database
// overriding pool.query with a logging wrapper

pool.query = async function query(text, params) {
  // Just delegate to the pool - pg handles everything
  const start = Date.now();
  try {
    const result = await originalQuery(text, params);
    const duration = Date.now() - start;

    // Log slow queries to help with debugging
    if (duration > 1000) {
      console.warn('Slow query (' + duration + 'ms):', text.substring(0, 100));
    }

    return result;
  } catch (err) {
    // Add some context to the error
    console.error('Query error:', err.message);
    // context for string type text for eg
    if (typeof text == 'string') {
      console.error('Query was:', text.substring(0, 200));
    }
    throw err;
  }
};

// Also expose the raw pool in case someone needs it
// (for transactions etc.)
// exporing the pool now, 
// PS [no need to export query again, changing it, due to max-call-size stack exceeded error during migration]
module.exports = pool;
//module.exports.query = query
