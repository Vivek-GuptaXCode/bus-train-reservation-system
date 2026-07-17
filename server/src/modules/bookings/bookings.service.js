// modules/bookings/bookings.service.js
// STUDENT NOTE: This is a simplified booking service.
// The full transactional booking with seat locking will be implemented in the next phase.

const pool = require('../../db/pool');
const config = require('../../config/env');
const { notFound, badRequest, conflict } = require('../../shared/errors');

// TODO: Add seat locking and concurrency handling
// TODO: Implement six-ticket rule check

/**
 * Create a booking with payment and tickets.
 * Simplified implementation for demo purposes.
 *
 * @param {Object} data
 * @param {number} data.passengerId - p_id of the passenger
 * @param {number} data.serviceRunId
 * @param {number} data.boardingStopId
 * @param {number} data.disembarkingStopId
 * @param {number[]} data.seatIds - Array of seat IDs to book
 * @param {string} data.paymentTransactionId - Transaction ID from payment
 * @param {string} data.paymentMode - Payment mode (Online, Cash, etc.)
 */
async function createBooking(data) {
  const {
    passengerId,
    serviceRunId,
    boardingStopId,
    disembarkingStopId,
    seatIds,
    paymentTransactionId,
    paymentMode
  } = data;

  // Use a client for transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Step 1: Validate stops belong to the same route and boarding comes before disembarking
    const stopsResult = await client.query(
      `SELECT
         origin.route_stop_id AS boarding_stop_id,
         origin.stop_name AS boarding_stop_name,
         origin.stop_sequence AS boarding_sequence,
         origin.distance_from_origin AS boarding_distance,
         dest.route_stop_id AS disembarking_stop_id,
         dest.stop_name AS disembarking_stop_name,
         dest.stop_sequence AS destination_sequence,
         dest.distance_from_origin AS destination_distance,
         (dest.distance_from_origin - origin.distance_from_origin) AS journey_distance,
         origin.route_id
       FROM route_stop origin
       JOIN route_stop dest ON dest.route_id = origin.route_id
       WHERE origin.route_stop_id = $1
         AND dest.route_stop_id = $2
         AND origin.stop_sequence < dest.stop_sequence`,
      [boardingStopId, disembarkingStopId]
    );

    if (stopsResult.rows.length === 0) {
      throw badRequest('Invalid route segment: stops are not on the same route or boarding is after disembarking');
    }

    const segment = stopsResult.rows[0];

    // Step 2: Get the service run info
    const runResult = await client.query(
      `SELECT sr.*, s.service_type, s.route_id
       FROM service_run sr
       JOIN service s ON s.service_id = sr.service_id
       WHERE sr.service_run_id = $1
         AND sr.status = 'Open'`,
      [serviceRunId]
    );

    if (runResult.rows.length === 0) {
      throw badRequest('Service run not found or not available');
    }

    const run = runResult.rows[0];

    // Verify the stops are on the same route as the service
    if (segment.route_id !== run.route_id) {
      throw badRequest('The selected stops do not belong to the route of this service run');
    }

    // Step 3: Simple seat availability check (will be enhanced later for overlap checks)
    // For now, just check that seats exist and belong to the right transport
    for (let i = 0; i < seatIds.length; i++) {
      const seatId = seatIds[i];

      const seatResult = await client.query(
        `SELECT s.seat_id, s.seat_no, s.transport_id
         FROM seat s
         WHERE s.seat_id = $1
           AND s.transport_id = $2`,
        [seatId, run.transport_id]
      );

      if (seatResult.rows.length === 0) {
        throw badRequest('Seat ID ' + seatId + ' does not belong to this transport');
      }

      // Quick check - is this seat already booked on this run?
      const existingTicket = await client.query(
        `SELECT t.ticket_id
         FROM ticket t
         JOIN booking b ON b.booking_id = t.booking_id
         LEFT JOIN cancellation c ON c.ticket_id = t.ticket_id
         WHERE t.service_run_id = $1
           AND t.seat_id = $2
           AND b.status = 'Confirmed'
           AND c.ticket_id IS NULL`,
        [serviceRunId, seatId]
      );

      if (existingTicket.rows.length > 0) {
        throw conflict('Seat ' + seatResult.rows[0].seat_no + ' is already booked');
      }
    }

    // Step 4: Calculate fare
    const fareRate = run.service_type === 'Train'
      ? config.TRAIN_FARE_RATE
      : config.BUS_FARE_RATE;

    const distance = parseFloat(segment.journey_distance);
    const farePerTicket = parseFloat((distance * fareRate).toFixed(2));
    const totalAmount = parseFloat((farePerTicket * seatIds.length).toFixed(2));

    // Step 5: Insert payment record (simplified - always Successful for demo)
    const paymentResult = await client.query(
      `INSERT INTO payment (amount, mode, status, transaction_id, date_time)
       VALUES ($1, $2, 'Successful', $3, NOW())
       RETURNING *`,
      [totalAmount, paymentMode, paymentTransactionId]
    );

    const payment = paymentResult.rows[0];

    // Step 6: Insert booking
    const bookingResult = await client.query(
      `INSERT INTO booking (total_amount, status, p_id, payment_id, boarding_stop_id, disembarking_stop_id, date_time)
       VALUES ($1, 'Confirmed', $2, $3, $4, $5, NOW())
       RETURNING *`,
      [totalAmount, passengerId, payment.payment_id, boardingStopId, disembarkingStopId]
    );

    const booking = bookingResult.rows[0];

    // Step 7: Insert tickets for each seat
    const tickets = [];
    const boardingInfo = segment.boarding_stop_name + ' (Stop #' + segment.boarding_sequence + ')';
    const disembarkingInfo = segment.disembarking_stop_name + ' (Stop #' + segment.destination_sequence + ')';

    for (let i = 0; i < seatIds.length; i++) {
      const seatId = seatIds[i];

      const ticketResult = await client.query(
        `INSERT INTO ticket (fare_amount, boarding_info, disembarking_info, booking_id, service_run_id, seat_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [farePerTicket, boardingInfo, disembarkingInfo, booking.booking_id, serviceRunId, seatId]
      );

      tickets.push(ticketResult.rows[0]);
    }

    await client.query('COMMIT');

    return {
      booking: booking,
      payment: payment,
      tickets: tickets
    };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get a booking by ID with all related data JOINed
 */
async function getBookingById(bookingId) {
  const result = await pool.query(
    `SELECT
       b.booking_id, b.date_time, b.total_amount, b.status,
       p.p_id AS passenger_id, p.name AS passenger_name, p.email AS passenger_email, p.phone AS passenger_phone,
       pay.payment_id, pay.amount AS payment_amount, pay.mode AS payment_mode,
       pay.status AS payment_status, pay.transaction_id,
       pay.date_time AS payment_date_time,
       board.stop_name AS boarding_stop_name,
       disembark.stop_name AS disembarking_stop_name,
       sr.run_id, sr.departure_time, sr.arrival_time, sr.status AS run_status,
       s.service_name, s.service_type,
       r.route_name,
       t.transport_number
     FROM booking b
     JOIN passenger p ON p.p_id = b.p_id
     LEFT JOIN payment pay ON pay.payment_id = b.payment_id
     JOIN route_stop board ON board.route_stop_id = b.boarding_stop_id
     JOIN route_stop disembark ON disembark.route_stop_id = b.disembarking_stop_id
     LEFT JOIN ticket tk ON tk.booking_id = b.booking_id
     LEFT JOIN service_run sr ON sr.service_run_id = tk.service_run_id
     LEFT JOIN service s ON s.service_id = sr.service_id
     LEFT JOIN route r ON r.route_id = s.route_id
     LEFT JOIN transport t ON t.transport_id = sr.transport_id
     WHERE b.booking_id = $1`,
    [bookingId]
  );

  // If no rows returned, booking doesn't exist
  if (result.rows.length === 0) {
    throw notFound('Booking not found');
  }

  const booking = result.rows[0];

  // Get the tickets for this booking separately to keep things clean
  const ticketsResult = await pool.query(
    `SELECT tk.*, s.seat_no, c.cancellation_id, c.reason AS cancel_reason,
            c.date_time AS cancel_date_time, rf.amount AS refund_amount,
            rf.status AS refund_status
     FROM ticket tk
     JOIN seat s ON s.seat_id = tk.seat_id
     LEFT JOIN cancellation c ON c.ticket_id = tk.ticket_id
     LEFT JOIN refund rf ON rf.cancellation_id = c.cancellation_id
     WHERE tk.booking_id = $1
     ORDER BY s.seat_no`,
    [bookingId]
  );

  booking.tickets = ticketsResult.rows;

  return booking;
}

/**
 * Get all bookings for a passenger, ordered by date descending
 */
async function getPassengerBookings(passengerId) {
  const result = await pool.query(
    `SELECT
       b.booking_id, b.date_time, b.total_amount, b.status,
       board.stop_name AS boarding_stop_name,
       disembark.stop_name AS disembarking_stop_name
     FROM booking b
     JOIN route_stop board ON board.route_stop_id = b.boarding_stop_id
     JOIN route_stop disembark ON disembark.route_stop_id = b.disembarking_stop_id
     WHERE b.p_id = $1
     ORDER BY b.date_time DESC`,
    [passengerId]
  );

  return result.rows;
}

module.exports = {
  createBooking,
  getBookingById,
  getPassengerBookings
};
