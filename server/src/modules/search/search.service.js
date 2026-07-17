// modules/search/search.service.js
// Handles service search and seat availability queries

const pool = require('../../db/pool');
const config = require('../../config/env');
const { notFound, badRequest } = require('../../shared/errors');

/**
 * Search for available service runs between two stops on a given date.
 *
 * @param {Object} params
 * @param {number} params.boardingStopId - The route_stop_id to board at
 * @param {number} params.disembarkingStopId - The route_stop_id to get off at
 * @param {string} params.travelDate - Date in YYYY-MM-DD format
 * @param {number} params.passengerCount - Number of passengers
 */
async function searchServices(params) {
  const { boardingStopId, disembarkingStopId, travelDate, passengerCount } = params;

  // The main search query - finds service runs where:
  // 1. Both stops are on the same route
  // 2. Boarding comes before disembarking (in stop sequence)
  // 3. The run is Open and departs on the requested date
  // This is the complex query with lots of JOINs
  const result = await pool.query(
    `SELECT
       sr.service_run_id,
       sr.run_id,
       sr.departure_time,
       sr.arrival_time,
       sr.status AS service_run_status,
       s.service_id,
       s.service_name,
       s.service_type,
       r.route_id,
       r.route_name,
       tr.transport_id,
       tr.transport_number,
       tr.capacity,
       origin.route_stop_id AS boarding_stop_id,
       origin.stop_name AS boarding_stop_name,
       origin.stop_sequence AS boarding_sequence,
       destination.route_stop_id AS disembarking_stop_id,
       destination.stop_name AS disembarking_stop_name,
       destination.stop_sequence AS destination_sequence,
       (destination.distance_from_origin - origin.distance_from_origin) AS journey_distance
     FROM route_stop origin
     JOIN route_stop destination
       ON destination.route_id = origin.route_id
      AND destination.stop_sequence > origin.stop_sequence
     JOIN route r
       ON r.route_id = origin.route_id
     JOIN service s
       ON s.route_id = r.route_id
     JOIN service_run sr
       ON sr.service_id = s.service_id
     JOIN transport tr
       ON tr.transport_id = sr.transport_id
     WHERE origin.route_stop_id = $1
       AND destination.route_stop_id = $2
       AND sr.status = 'Open'
       AND sr.departure_time >= $3::date
       AND sr.departure_time < ($3::date + interval '1 day')
     ORDER BY sr.departure_time`,
    [boardingStopId, disembarkingStopId, travelDate]
  );

  // Now for each run, we need to calculate how many seats are available
  // and the estimated fare
  const runs = result.rows;

  // Enhance each run with seat count and fare info
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];

    // Calculate available seats for this run
    // Count total seats minus occupied ones
    const seatResult = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM seat WHERE transport_id = $1) AS total_seats,
         (SELECT COUNT(DISTINCT t.seat_id)
          FROM ticket t
          JOIN booking b ON b.booking_id = t.booking_id
          LEFT JOIN cancellation c ON c.ticket_id = t.ticket_id
          WHERE t.service_run_id = $2
            AND b.status = 'Confirmed'
            AND c.ticket_id IS NULL
         ) AS booked_seats`,
      [run.transport_id, run.service_run_id]
    );

    const totalSeats = parseInt(seatResult.rows[0].total_seats, 10);
    const bookedSeats = parseInt(seatResult.rows[0].booked_seats || 0, 10);
    run.available_seats = totalSeats - bookedSeats;
    run.total_seats = totalSeats;

    // Calculate fare estimate based on service type
    // Bus and Train have different per-km rates from config
    const fareRate = run.service_type === 'Train'
      ? config.TRAIN_FARE_RATE
      : config.BUS_FARE_RATE;

    const distance = parseFloat(run.journey_distance);
    run.estimated_fare_per_ticket = parseFloat((distance * fareRate).toFixed(2));
    run.estimated_total_fare = parseFloat((run.estimated_fare_per_ticket * passengerCount).toFixed(2));

    // Check if there are enough seats
    run.has_enough_seats = run.available_seats >= passengerCount;
  }

  return runs;
}

/**
 * Get seat availability for a specific service run and route segment.
 * Checks which seats are available (not already booked on overlapping segments).
 *
 * @param {number} serviceRunId
 * @param {number} boardingStopId
 * @param {number} disembarkingStopId
 */
async function getSeatAvailability(serviceRunId, boardingStopId, disembarkingStopId) {
  // First, get the route and transport info for this service run
  const runResult = await pool.query(
    `SELECT sr.service_run_id, sr.transport_id, s.route_id
     FROM service_run sr
     JOIN service s ON s.service_id = sr.service_id
     WHERE sr.service_run_id = $1
       AND sr.status = 'Open'`,
    [serviceRunId]
  );

  if (runResult.rows.length === 0) {
    throw notFound('Service run not found or not open');
  }

  const run = runResult.rows[0];

  // Get the boarding and disembarking stop sequences
  const stopsResult = await pool.query(
    `SELECT
       rb.stop_sequence AS boarding_sequence,
       rd.stop_sequence AS destination_sequence
     FROM route_stop rb
     JOIN route_stop rd ON rd.route_id = rb.route_id
     WHERE rb.route_stop_id = $1
       AND rd.route_stop_id = $2
       AND rb.stop_sequence < rd.stop_sequence`,
    [boardingStopId, disembarkingStopId]
  );

  if (stopsResult.rows.length === 0) {
    throw badRequest('Invalid route segment: stops are not on the same route or boarding is after disembarking');
  }

  const segment = stopsResult.rows[0];

  // Now find occupied seats using the overlap logic:
  // A seat is occupied if there's an existing ticket where the segments overlap.
  // overlap happens when: new_boarding < existing_destination AND new_destination > existing_boarding
  const result = await pool.query(
    `WITH requested_segment AS (
       SELECT
         $3::integer AS new_boarding_sequence,
         $4::integer AS new_destination_sequence
     ),
     occupied_seats AS (
       SELECT DISTINCT t.seat_id
       FROM ticket t
       JOIN booking b ON b.booking_id = t.booking_id
       JOIN route_stop eb ON eb.route_stop_id = b.boarding_stop_id
       JOIN route_stop ed ON ed.route_stop_id = b.disembarking_stop_id
       LEFT JOIN cancellation c ON c.ticket_id = t.ticket_id
       CROSS JOIN requested_segment rs
       WHERE t.service_run_id = $1
         AND b.status = 'Confirmed'
         AND c.ticket_id IS NULL
         AND rs.new_boarding_sequence < ed.stop_sequence
         AND rs.new_destination_sequence > eb.stop_sequence
     )
     SELECT
       s.seat_id,
       s.seat_no,
       CASE WHEN os.seat_id IS NULL THEN true ELSE false END AS is_available
     FROM seat s
     LEFT JOIN occupied_seats os ON os.seat_id = s.seat_id
     WHERE s.transport_id = $2
     ORDER BY s.seat_no`,
    [serviceRunId, run.transport_id, segment.boarding_sequence, segment.destination_sequence]
  );

  return result.rows;
}

module.exports = {
  searchServices,
  getSeatAvailability
};
