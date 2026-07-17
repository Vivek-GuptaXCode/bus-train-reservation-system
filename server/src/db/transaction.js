// db/transaction.js
// Helper for database transactions

const pool = require('./pool');

// runs a callback inside a database transaction - commits on success, rolls back on error
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
