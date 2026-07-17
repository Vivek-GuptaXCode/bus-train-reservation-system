// modules/tickets/tickets.routes.js
// Express router for ticket endpoints (view, e-ticket, cancel)

const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { ROLES } = require('../../shared/constants');
const { forbidden, badRequest } = require('../../shared/errors');
const pool = require('../../db/pool');
const ticketsService = require('./tickets.service');

const router = express.Router();

/**
 * Helper to check if the current user owns the ticket (is the passenger who booked it)
 * or is a Booking Clerk / Admin who can view any ticket.
 */
async function checkTicketOwnership(ticketId, req) {
  // Booking clerks and admins can access any ticket
  if (req.user.role === ROLES.BOOKING_CLERK || req.user.role === ROLES.ADMINISTRATOR) {
    return true;
  }

  // Passengers: check ownership via booking -> passenger -> user_id
  const result = await pool.query(
    `SELECT b.p_id
     FROM ticket tk
     JOIN booking b ON b.booking_id = tk.booking_id
     JOIN passenger p ON p.p_id = b.p_id
     WHERE tk.ticket_id = $1
       AND p.user_id = $2`,
    [ticketId, req.user.userId]
  );

  if (result.rows.length === 0) {
    return false;
  }

  return true;
}

// GET /:ticketId - get ticket details
router.get('/:ticketId', authenticate, async function (req, res, next) {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);

    // Ownership check
    const ownsTicket = await checkTicketOwnership(ticketId, req);
    if (!ownsTicket) {
      throw forbidden('You can only view your own tickets');
    }

    const ticket = await ticketsService.getTicketById(ticketId);

    res.json({
      success: true,
      data: ticket
    });

  } catch (err) {
    next(err);
  }
});

// GET /:ticketId/e-ticket - get e-ticket for a ticket
router.get('/:ticketId/e-ticket', authenticate, async function (req, res, next) {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);

    // Ownership check
    const ownsTicket = await checkTicketOwnership(ticketId, req);
    if (!ownsTicket) {
      throw forbidden('You can only view your own e-tickets');
    }

    const eTicket = await ticketsService.getETicket(ticketId);

    res.json({
      success: true,
      data: eTicket
    });

  } catch (err) {
    next(err);
  }
});

// POST /:ticketId/cancel - cancel a ticket
router.post('/:ticketId/cancel', authenticate, async function (req, res, next) {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      throw badRequest('Cancellation reason is required');
    }

    // Ownership check
    const ownsTicket = await checkTicketOwnership(ticketId, req);
    if (!ownsTicket) {
      throw forbidden('You can only cancel your own tickets');
    }

    const result = await ticketsService.cancelTicket(ticketId, reason, req.user.userId);

    res.json({
      success: true,
      data: result
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
