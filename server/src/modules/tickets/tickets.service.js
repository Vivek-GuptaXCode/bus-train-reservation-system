// modules/tickets/tickets.service.js
// Handles ticket retrieval and cancellation operations

const pool = require('../../db/pool');
const { notFound, badRequest, conflict } = require('../../shared/errors');
const policy = require('../../config/policy');

// TODO: Use configurable refund policy instead of hardcoded 50%

// get a ticket by ID with all related info JOINed
async function getTicketById(ticketId) {
  const result = await pool.query(
    `SELECT
       tk.ticket_id, tk.fare_amount, tk.boarding_info, tk.disembarking_info,
       b.booking_id, b.date_time AS booking_date_time, b.status AS booking_status,
       b.boarding_stop_id, b.disembarking_stop_id,
       p.p_id AS passenger_id, p.name AS passenger_name, p.email AS passenger_email,
       s.seat_no,
       sr.service_run_id, sr.run_id, sr.departure_time, sr.arrival_time,
       sr.status AS run_status,
       sv.service_name, sv.service_type,
       t.transport_number, t.transport_type,
       r.route_name,
       pay.amount AS payment_amount, pay.mode AS payment_mode,
       pay.status AS payment_status,
       c.cancellation_id, c.reason AS cancel_reason,
       c.date_time AS cancel_date_time,
       rf.refund_id, rf.amount AS refund_amount,
       rf.status AS refund_status, rf.date_time AS refund_date_time
     FROM ticket tk
     JOIN booking b ON b.booking_id = tk.booking_id
     JOIN passenger p ON p.p_id = b.p_id
     JOIN seat s ON s.seat_id = tk.seat_id
     JOIN service_run sr ON sr.service_run_id = tk.service_run_id
     JOIN service sv ON sv.service_id = sr.service_id
     JOIN transport t ON t.transport_id = sr.transport_id
     JOIN route r ON r.route_id = sv.route_id
     LEFT JOIN payment pay ON pay.payment_id = b.payment_id
     LEFT JOIN cancellation c ON c.ticket_id = tk.ticket_id
     LEFT JOIN refund rf ON rf.cancellation_id = c.cancellation_id
     WHERE tk.ticket_id = $1`,
    [ticketId]
  );

  if (result.rows.length === 0) {
    throw notFound('Ticket not found');
  }

  return result.rows[0];
}

// get e-ticket for a ticket
async function getETicket(ticketId) {
  // First check ticket exists
  const ticketCheck = await pool.query(
    'SELECT ticket_id FROM ticket WHERE ticket_id = $1',
    [ticketId]
  );

  if (ticketCheck.rows.length === 0) {
    throw notFound('Ticket not found');
  }

  const result = await pool.query(
    `SELECT et.*
     FROM e_ticket et
     WHERE et.ticket_id = $1`,
    [ticketId]
  );

  if (result.rows.length === 0) {
    throw notFound('E-ticket not found for this ticket');
  }

  return result.rows[0];
}

// cancel a ticket - WIP, will finish this later
async function cancelTicket(ticketId, reason, userId) {
  // Use a client for transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Step 1: Get the ticket with booking and service run info
    const ticketResult = await client.query(
      `SELECT
         tk.ticket_id, tk.fare_amount,
         b.booking_id, b.status AS booking_status, b.p_id,
         sr.service_run_id, sr.departure_time, sr.status AS run_status
       FROM ticket tk
       JOIN booking b ON b.booking_id = tk.booking_id
       JOIN service_run sr ON sr.service_run_id = tk.service_run_id
       WHERE tk.ticket_id = $1
       FOR UPDATE`,
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      throw notFound('Ticket not found');
    }

    const ticket = ticketResult.rows[0];

    // Step 2: Check ticket isn't already cancelled
    const cancelCheck = await client.query(
      'SELECT cancellation_id FROM cancellation WHERE ticket_id = $1',
      [ticketId]
    );

    if (cancelCheck.rows.length > 0) {
      throw conflict('Ticket has already been cancelled');
    }

    // Step 3: Check service run hasn't departed yet
    var now = new Date();
    var departureTime = new Date(ticket.departure_time);
    // console.log('debug: now=', now, 'departure=', departureTime);

    if (now >= departureTime) {
      throw badRequest('Cannot cancel ticket: service run has already departed');
    }

    // Step 4: Calculate refund amount
    // Simple refund: 50% of fare (simplified for now)
// TODO: Use configurable refund policy instead of hardcoded 50%
// FIXME: this might break if departure time is in the past
// TODO: add better error handling for edge cases
    const refundPercentage = 50;
    const refundAmount = parseFloat(
      (parseFloat(ticket.fare_amount) * refundPercentage / 100).toFixed(2)
    );

    // Step 5: Insert cancellation record
    const cancelResult = await client.query(
      `INSERT INTO cancellation (reason, ticket_id, date_time)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [reason, ticketId]
    );

    const cancellation = cancelResult.rows[0];

    // Step 6: Insert refund record
    const refundResult = await client.query(
      `INSERT INTO refund (amount, status, cancellation_id, date_time)
       VALUES ($1, 'Processed', $2, NOW())
       RETURNING *`,
      [refundAmount, cancellation.cancellation_id]
    );

    const refund = refundResult.rows[0];

    // Step 7: Check if all tickets in the booking are now cancelled
    // If yes, update booking status to Cancelled
    const remainingTickets = await client.query(
      `SELECT COUNT(*) AS active_count
       FROM ticket tk
       LEFT JOIN cancellation c ON c.ticket_id = tk.ticket_id
       WHERE tk.booking_id = $1
         AND c.cancellation_id IS NULL`,
      [ticket.booking_id]
    );

    if (parseInt(remainingTickets.rows[0].active_count, 10) === 0) {
      await client.query(
        `UPDATE booking SET status = 'Cancelled'
         WHERE booking_id = $1`,
        [ticket.booking_id]
      );
    }

    await client.query('COMMIT');

    return {
      cancellation: cancellation,
      refund: refund
    };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getTicketById,
  getETicket,
  cancelTicket
};
