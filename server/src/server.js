// server.js
// Entry point of the application
// Starts the HTTP server and handles graceful shutdown

const app = require('./app');
const config = require('./config/env');
const pool = require('./db/pool');

// Validate configuration before starting
// This will throw if critical settings are missing
console.log('Validating configuration...');
config.validateConfig();
console.log('Configuration OK.');

// Start the server
var server = app.listen(config.PORT, function () {
  console.log('Server running on port ' + config.PORT);
  console.log('Environment settings:');
  console.log('  - Bus fare rate: ' + config.BUS_FARE_RATE + ' per km');
  console.log('  - Train fare rate: ' + config.TRAIN_FARE_RATE + ' per km');
  console.log('  - Concession: ' + config.CONCESSION_PERCENT + '%');
  console.log('  - Client origin: ' + config.CLIENT_ORIGIN);
});

// --- Graceful Shutdown ---
// Close connections cleanly when the server is stopped

function shutdown(signal) {
  console.log('\nReceived ' + signal + '. Shutting down gracefully...');

  server.close(function () {
    console.log('HTTP server closed.');

    // Close the database pool so connections are released
    pool.end(function () {
      console.log('Database pool closed.');
      process.exit(0);
    });
  });

  // If we don't shut down within 10 seconds, force exit
  // FIXME: this timeout might be too short for production
  setTimeout(function () {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

// Listen for termination signals
process.on('SIGTERM', function () {
  shutdown('SIGTERM');
});

process.on('SIGINT', function () {
  shutdown('SIGINT');
});

// Also handle unhandled rejections so they don't silently crash the server
process.on('unhandledRejection', function (reason, promise) {
  console.error('Unhandled Promise Rejection:');
  console.error(reason);
  // Don't exit here - let the error handler deal with it
});

module.exports = server;
