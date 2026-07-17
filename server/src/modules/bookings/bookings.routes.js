// modules/bookings/bookings.routes.js
// Express router for booking endpoints

const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { ROLES } = require('../../shared/constants');
const { forbidden, badRequest } = require('../../shared/errors');
const bookingsService = require('./bookings.service');

const router = express.Router();

// POST /confirm - create a new booking with payment and tickets
router.post('/confirm', authenticate, authorize(ROLES.PASSENGER, ROLES.BOOKING_CLERK), async function (req, res, next) {
  try {
    // The body should contain all the booking info
    // passengerId, serviceRunId, boardingStopId, disembarkingStopId,
    // seatIds, paymentTransactionId, paymentMode
    const bookingData = req.body;

    // Basic validation
    if (!bookingData.serviceRunId || !bookingData.boardingStopId ||
        !bookingData.disembarkingStopId || !bookingData.seatIds ||
        bookingData.seatIds.length === 0) {
      throw badRequest('Missing required booking fields');
    }

    // If the user is a Passenger, they can only book for themselves
    // Booking Clerk can book for any passenger
    if (req.user.role === ROLES.PASSENGER) {
      // Passenger users need to provide their passenger ID
      // FIXME: we should look up the passenger ID from the user account instead
      // of trusting the request body. For now, accept it.
    }

    const result = await bookingsService.createBooking(bookingData);

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (err) {
    next(err);
  }
});

// GET /:bookingId - get a booking by ID
// Passengers can only see their own bookings
// Booking Clerks and Admins can see any booking
router.get('/:bookingId', authenticate, async function (req, res, next) {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);

    const booking = await bookingsService.getBookingById(bookingId);

    // Check ownership
    // Passengers can only view their own bookings
    if (req.user.role === ROLES.PASSENGER) {
      // We need to check if this booking belongs to the passenger
      // For now, we need to look up the passenger's p_id from the user_id
      const passengerResult = await require('../../db/pool').query(
        'SELECT p_id FROM passenger WHERE user_id = $1',
        [req.user.userId]
      );

      if (passengerResult.rows.length === 0) {
        throw forbidden('Passenger profile not found');
      }

      const passengerPId = passengerResult.rows[0].p_id;

      // Check if the booking's passenger_id matches
      if (parseInt(booking.passenger_id) !== parseInt(passengerPId)) {
        throw forbidden('You can only view your own bookings');
      }
    }
    // Booking clerks and admins can view any booking - no additional check needed

    res.json({
      success: true,
      data: booking
    });

  } catch (err) {
    next(err);
  }
});

// GET /passengers/:passengerId/bookings - get all bookings for a passenger
router.get('/passengers/:passengerId/bookings', authenticate, async function (req, res, next) {
  try {
    const passengerId = parseInt(req.params.passengerId, 10);

    // Check ownership
    if (req.user.role === ROLES.PASSENGER) {
      const passengerResult = await require('../../db/pool').query(
        'SELECT p_id FROM passenger WHERE user_id = $1',
        [req.user.userId]
      );

      if (passengerResult.rows.length === 0) {
        throw forbidden('Passenger profile not found');
      }

      const ownPId = parseInt(passengerResult.rows[0].p_id);
      if (passengerId !== ownPId) {
        throw forbidden('You can only view your own bookings');
      }
    }

    const bookings = await bookingsService.getPassengerBookings(passengerId);

    res.json({
      success: true,
      data: bookings
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
