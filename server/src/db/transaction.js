// db/transaction.js
// Helper for database transactions

const pool = require('./pool');

/**
 * Runs a callback inside a database transaction.
 * If the callback succeeds, commits. If it throws, rolls back.
 *
 * Example usage:
 *   withTransaction(async (client) => {
 *     await client.query('INSERT INTO ...');
 *     await client.query('UPDATE ...');
 *   });
 *
 * @param {Function} callback - Async function that receives a pg client
 * @returns {Promise} Whatever the callback returns
 */
async function withTransaction(callback) {
  // Get a client from the pool
  const client = await pool.connect();

  try {
    // Start the transaction
    await client.query('BEGIN');

    // Run the actual work
    const result = await callback(client);

    // If we got here, everything worked - commit!
    await client.query('COMMIT');

    return result;
  } catch (err) {
    // Something went wrong - roll everything back
    await client.query('ROLLBACK');
    // Re-throw so the caller knows it failed
    throw err;
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}

module.exports = { withTransaction };
