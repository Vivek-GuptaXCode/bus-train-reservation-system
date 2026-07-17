// modules/search/search.routes.js
// Express router for search endpoints (finding service runs and seat availability)

const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { ROLES } = require('../../shared/constants');
const { badRequest } = require('../../shared/errors');
const searchService = require('./search.service');

const router = express.Router();

// GET /service-runs - search for available service runs
// Query params: boardingStopId, disembarkingStopId, travelDate, passengerCount
router.get('/service-runs', authenticate, authorize(ROLES.PASSENGER, ROLES.BOOKING_CLERK, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const { boardingStopId, disembarkingStopId, travelDate, passengerCount } = req.query;

    // Validate required query params
    if (!boardingStopId || !disembarkingStopId || !travelDate) {
      throw badRequest('Missing required query parameters: boardingStopId, disembarkingStopId, travelDate');
    }

    // Default passenger count to 1 if not provided
    const paxCount = parseInt(passengerCount, 10) || 1;

    if (paxCount < 1 || paxCount > 6) {
      throw badRequest('passengerCount must be between 1 and 6');
    }

    const results = await searchService.searchServices({
      boardingStopId: parseInt(boardingStopId, 10),
      disembarkingStopId: parseInt(disembarkingStopId, 10),
      travelDate: travelDate,
      passengerCount: paxCount
    });

    res.json({
      success: true,
      data: results
    });

  } catch (err) {
    next(err);
  }
});

// GET /service-runs/:serviceRunId/seats - get seat availability for a run
// Query params: boardingStopId, disembarkingStopId
router.get('/service-runs/:serviceRunId/seats', authenticate, async function (req, res, next) {
  try {
    const serviceRunId = parseInt(req.params.serviceRunId, 10);
    const { boardingStopId, disembarkingStopId } = req.query;

    if (!boardingStopId || !disembarkingStopId) {
      throw badRequest('Missing required query parameters: boardingStopId, disembarkingStopId');
    }

    const seats = await searchService.getSeatAvailability(
      serviceRunId,
      parseInt(boardingStopId, 10),
      parseInt(disembarkingStopId, 10)
    );

    res.json({
      success: true,
      data: seats
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
