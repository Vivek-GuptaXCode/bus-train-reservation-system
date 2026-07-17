// db/seed.js
// Seed runner — reads SQL files from database/seeds/ and runs them in order.
// Usage: node src/db/seed.js  (from the server/ directory)

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

// Load environment variables from the project root .env
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Seeds live in the project root, not inside server/
const SEEDS_DIR = path.join(__dirname, '..', '..', '..', 'database', 'seeds');

/**
 * Read all .sql files from the seeds directory, sorted by filename.
 *
 * @returns {string[]} Array of absolute file paths
 */
function getSeedFiles() {
  var files = fs.readdirSync(SEEDS_DIR);
  var sqlFiles = files.filter(function (file) {
    return file.endsWith('.sql');
  });
  sqlFiles.sort();
  return sqlFiles.map(function (file) {
    return path.join(SEEDS_DIR, file);
  });
}

/**
 * Runs a single seed SQL file against the database.
 *
 * @param {string} filePath - Absolute path to the .sql file
 * @param {number} index - Current seed index (for display)
 * @param {number} total - Total number of seed files
 */
async function runSeed(filePath, index, total) {
  var fileName = path.basename(filePath);
  console.log('[' + index + '/' + total + '] Running seed: ' + fileName + '...');

  var sql = fs.readFileSync(filePath, 'utf8');

  try {
    await pool.query(sql);
    console.log('  ✓ Done: ' + fileName);
  } catch (err) {
    console.error('  ✗ Failed: ' + fileName);
    console.error('    Error: ' + err.message);
    throw err;
  }
}

/**
 * Main entry point. Runs all seed files in sequence.
 */
async function seed() {
  var files = getSeedFiles();

  if (files.length === 0) {
    console.log('No seed files found in: ' + SEEDS_DIR);
    return;
  }

  console.log('Found ' + files.length + ' seed file(s) in database/seeds/\n');

  for (var i = 0; i < files.length; i++) {
    await runSeed(files[i], i + 1, files.length);
  }

  console.log('\nAll seeds completed successfully.');
}

// Run and clean up
seed()
  .then(function () {
    return pool.end();
  })
  .then(function () {
    console.log('Database pool closed.');
    process.exit(0);
  })
  .catch(function (err) {
    console.error('\nSeed failed:', err.message);
    pool.end().then(function () {
      process.exit(1);
    });
  });
