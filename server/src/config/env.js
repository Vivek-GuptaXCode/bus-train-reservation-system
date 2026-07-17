// config/env.js
// Loads environment variables and exports them nicely

const dotenv = require('dotenv');

// Load .env file into process.env
dotenv.config();

// All the config stuff in one place
const config = {
  PORT: parseInt(process.env.PORT, 10) || 4000,

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // JWT settings
  JWT_SECRET: process.env.JWT_SECRET || '',
  // TODO: maybe make this configurable per user role later
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Password hashing
  BCRYPT_COST: parseInt(process.env.BCRYPT_COST, 10) || 10,

  // CORS
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

  // Fare calculation rates (in currency units per km)
  BUS_FARE_RATE: parseFloat(process.env.BUS_FARE_RATE) || 1.50,
  TRAIN_FARE_RATE: parseFloat(process.env.TRAIN_FARE_RATE) || 2.00,

  // Concession percentage (e.g., 20 means 20% off)
  CONCESSION_PERCENT: parseFloat(process.env.CONCESSION_PERCENT) || 20.0,

  // Service run - how early (in hours) before departure ticket sales close
  BOOKING_CLOSE_HOURS: parseInt(process.env.BOOKING_CLOSE_HOURS, 10) || 1,

  // Booking limits
  // FIXME: these should maybe come from policy.js instead
  MAX_TICKETS_PER_BOOKING: parseInt(process.env.MAX_TICKETS_PER_BOOKING, 10) || 6,
  MAX_SEATS_PER_BOOKING: parseInt(process.env.MAX_SEATS_PER_BOOKING, 10) || 6,
};

/**
 * Checks that the important config values are actually set.
 * Logs warnings for missing stuff but only throws for critical ones.
 */
function validateConfig() {
  const warnings = [];

  // Database URL is critical - can't run without it
  if (!config.DATABASE_URL) {
    throw new Error(
      'FATAL: DATABASE_URL is not set. Please check your .env file.'
    );
  }

  // JWT secret is also critical
  if (!config.JWT_SECRET) {
    throw new Error(
      'FATAL: JWT_SECRET is not set. Please check your .env file.'
    );
  }

  // These are not critical but nice to know about
  if (!process.env.BUS_FARE_RATE) {
    warnings.push('BUS_FARE_RATE not set, using default: ' + config.BUS_FARE_RATE);
  }
  if (!process.env.TRAIN_FARE_RATE) {
    warnings.push('TRAIN_FARE_RATE not set, using default: ' + config.TRAIN_FARE_RATE);
  }
  if (!process.env.CONCESSION_PERCENT) {
    warnings.push('CONCESSION_PERCENT not set, using default: ' + config.CONCESSION_PERCENT);
  }
  if (!process.env.CLIENT_ORIGIN) {
    warnings.push('CLIENT_ORIGIN not set, using default: ' + config.CLIENT_ORIGIN);
  }

  // Print all warnings at once
  if (warnings.length > 0) {
    console.warn('--- Configuration Warnings ---');
    warnings.forEach(function (w) {
      console.warn('  ⚠  ' + w);
    });
    console.warn('------------------------------');
  }

  return true;
}

module.exports = config;
module.exports.validateConfig = validateConfig;
