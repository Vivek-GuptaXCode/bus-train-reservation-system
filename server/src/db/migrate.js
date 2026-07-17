// db/migrate.js
// Migration runner — reads SQL files from database/migrations/ and runs them in order.
// Usage: node src/db/migrate.js  (from the server/ directory)

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

// Load environment variables from the project root .env
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// The migrations directory lives in the project root, not inside server/
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', '..', 'database', 'migrations');

/**
 * Read all .sql files from the migrations directory, sorted by filename.
 * Sorting by name ensures they run in the correct order (e.g. 001, 002, 003).
 *
 * @returns {string[]} Array of absolute file paths
 */
function getMigrationFiles() {
  var files = fs.readdirSync(MIGRATIONS_DIR);
  var sqlFiles = files.filter(function (file) {
    return file.endsWith('.sql');
  });
  sqlFiles.sort(); // alphabetical order = numeric order when prefixed like 001, 002
  return sqlFiles.map(function (file) {
    return path.join(MIGRATIONS_DIR, file);
  });
}

/**
 * Runs a single migration SQL file against the database.
 * Reads the file, executes the SQL, and logs the outcome.
 *
 * @param {string} filePath - Absolute path to the .sql file
 * @param {number} index - Current migration index (for display)
 * @param {number} total - Total number of migrations
 */
async function runMigration(filePath, index, total) {
  var fileName = path.basename(filePath);
  console.log('[' + index + '/' + total + '] Running migration: ' + fileName + '...');

  // Read the SQL file contents
  var sql = fs.readFileSync(filePath, 'utf8');

  try {
    // Execute the whole SQL file at once
    await pool.query(sql);
    console.log('  ✓ Done: ' + fileName);
  } catch (err) {
    console.error('  ✗ Failed: ' + fileName);
    console.error('    Error: ' + err.message);
    throw err; // stop on first failure — don't run later migrations on a broken schema
  }
}

/**
 * Main entry point. Runs all migration files in sequence.
 */
async function migrate() {
  var files = getMigrationFiles();

  if (files.length === 0) {
    console.log('No migration files found in: ' + MIGRATIONS_DIR);
    return;
  }

  console.log('Found ' + files.length + ' migration file(s) in database/migrations/\n');

  for (var i = 0; i < files.length; i++) {
    await runMigration(files[i], i + 1, files.length);
  }

  console.log('\nAll migrations completed successfully.');
}

// Run and handle cleanup
migrate()
  .then(function () {
    return pool.end();
  })
  .then(function () {
    console.log('Database pool closed.');
    process.exit(0);
  })
  .catch(function (err) {
    console.error('\nMigration failed:', err.message);
    pool.end().then(function () {
      process.exit(1);
    });
  });
