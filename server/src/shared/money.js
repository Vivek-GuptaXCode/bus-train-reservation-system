// shared/money.js
// Simple fare calculation helpers
// Nothing fancy - just basic math

const config = require('../config/env');

/**
 * Calculate the fare for a journey.
 * Multiply distance by rate to get fare, then apply concession if applicable.
 *
 * @param {number} distance - Distance in kilometers between boarding and disembarking
 * @param {number} ratePerKm - Fare rate per kilometer
 * @param {boolean} hasConcession - Whether the passenger has a concession
 * @param {number} concessionPercent - Percentage discount (e.g., 20 = 20% off)
 * @returns {number} Final fare rounded to 2 decimal places
 */
function calculateFare(distance, ratePerKm, hasConcession, concessionPercent) {
  // multiply distance by rate to get fare
  var baseFare = distance * ratePerKm;

  // If they have a concession, give them a discount
  if (hasConcession && concessionPercent > 0) {
    var discount = baseFare * (concessionPercent / 100);
    baseFare = baseFare - discount;
  }

  // Round to 2 decimal places because money
  return Number(baseFare.toFixed(2));
}

/**
 * Calculate the distance between boarding and disembarking points.
 * Returns the absolute difference - simple but works for our use case.
 *
 * @param {number} boardingDist - Distance marker at boarding stop (km)
 * @param {number} disembarkingDist - Distance marker at disembarking stop (km)
 * @returns {number} Journey distance in km
 */
function calculateJourneyDistance(boardingDist, disembarkingDist) {
  // Just the absolute difference between the two markers
  // TODO: this assumes a linear route - won't work for circular routes
  var distance = Math.abs(disembarkingDist - boardingDist);

  // Round to 2 decimal places
  return Number(distance.toFixed(2));
}

module.exports = {
  calculateFare,
  calculateJourneyDistance,
};
