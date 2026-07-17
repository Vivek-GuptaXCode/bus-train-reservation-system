// config/policy.js
// Business rules for the reservation system
// These are the rules that decide things like refund amounts and limits

// Maximum number of tickets you can buy in one booking
const MAX_TICKETS_PER_BOOKING = 6;

// Maximum number of seats you can reserve in one booking
const MAX_SEATS_PER_BOOKING = 6;

/**
 * Refund policy bands.
 * Each band has:
 *   - hoursBefore: the minimum hours before departure for this band
 *   - percentage: the percentage of fare that will be refunded
 *
 * The list is sorted from highest hours to lowest.
 * Example: if you cancel 50 hours before, you get 80% back.
 * If you cancel 2 hours before, you get 25% back.
 */
let refundPolicyBands = [];

// Try to parse the refund policy from environment
try {
  if (process.env.REFUND_POLICY_JSON) {
    refundPolicyBands = JSON.parse(process.env.REFUND_POLICY_JSON);
  }
} catch (err) {
  console.warn('Could not parse REFUND_POLICY_JSON, using default policy.');
}

// Default refund policy if nothing was set in env
// this is used to decide how much money to give back
if (refundPolicyBands.length === 0) {
  refundPolicyBands = [
    { hoursBefore: 48, percentage: 80 },  // >= 48 hours: 80% refund
    { hoursBefore: 24, percentage: 60 },  // >= 24 hours: 60% refund
    { hoursBefore: 6, percentage: 40 },   // >= 6 hours: 40% refund
    { hoursBefore: 0, percentage: 10 },   // >= 0 hours (before departure): 10% refund
  ];
}

// Make sure bands are sorted descending by hoursBefore (highest first)
// This is important for the lookup function to work correctly
refundPolicyBands.sort(function (a, b) {
  return b.hoursBefore - a.hoursBefore;
});

/**
 * Figures out what percentage of the fare to refund
 * based on how many hours before departure the cancellation happens.
 *
 * @param {number} hoursBeforeDeparture - How many hours until departure
 * @returns {number} The refund percentage (0 to 100)
 */
function getRefundPercentage(hoursBeforeDeparture) {
  // FIXME: what if someone passes a negative number? should probably handle that
  if (hoursBeforeDeparture < 0) {
    return 0; // can't refund after departure
  }

  // Walk through the bands from most strict to least
  // and find the first one that applies
  for (var i = 0; i < refundPolicyBands.length; i++) {
    var band = refundPolicyBands[i];
    if (hoursBeforeDeparture >= band.hoursBefore) {
      return band.percentage;
    }
  }

  // Shouldn't get here because the last band has hoursBefore: 0
  return 0;
}

module.exports = {
  MAX_TICKETS_PER_BOOKING,
  MAX_SEATS_PER_BOOKING,
  refundPolicy: refundPolicyBands,
  getRefundPercentage,
};
