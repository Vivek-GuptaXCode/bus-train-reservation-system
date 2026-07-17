// shared/constants.js
// All the enum-like constants used across the app
// Keeping them in one place so we don't have magic strings everywhere

// User roles
const ROLES = {
  PASSENGER: 'passenger',
  BOOKING_CLERK: 'booking_clerk',
  OPERATIONS_STAFF: 'operations_staff',
  ADMINISTRATOR: 'administrator',
};

// Types of services available
const SERVICE_TYPES = {
  EXPRESS: 'express',
  INTERCITY: 'intercity',
  LOCAL: 'local',
  SLEEPER: 'sleeper', // for trains
  SHATABDI: 'shatabdi', // for trains
};

// Transport types (bus or train)
const TRANSPORT_TYPES = {
  BUS: 'bus',
  TRAIN: 'train',
};

// Booking statuses - tracks the life of a booking
const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

// Payment statuses
const PAYMENT_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
};

// Statuses for a specific service run (a trip on a date)
const SERVICE_RUN_STATUSES = {
  SCHEDULED: 'scheduled',
  BOARDING: 'boarding',
  IN_TRANSIT: 'in_transit',
  ARRIVED: 'arrived',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed',
};

// Refund request statuses
const REFUND_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSED: 'processed',
};

module.exports = {
  ROLES,
  SERVICE_TYPES,
  TRANSPORT_TYPES,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  SERVICE_RUN_STATUSES,
  REFUND_STATUSES,
};
