// modules/transports/transports.routes.js
// Express router for transport and seat endpoints

const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { ROLES } = require('../../shared/constants');
const transportsService = require('./transports.service');

const router = express.Router();

// GET / - list all transports
router.get('/', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const transports = await transportsService.getAllTransports();

    res.json({
      success: true,
      data: transports
    });

  } catch (err) {
    next(err);
  }
});

// POST / - create a new transport
router.post('/', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const transport = await transportsService.createTransport(req.body);

    res.status(201).json({
      success: true,
      data: transport
    });

  } catch (err) {
    next(err);
  }
});

// PATCH /:transportId - update a transport
router.patch('/:transportId', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const transportId = parseInt(req.params.transportId, 10);
    const updated = await transportsService.updateTransport(transportId, req.body);

    res.json({
      success: true,
      data: updated
    });

  } catch (err) {
    next(err);
  }
});

// GET /:transportId/seats - list seats for a transport
router.get('/:transportId/seats', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const transportId = parseInt(req.params.transportId, 10);
    const seats = await transportsService.getTransportSeats(transportId);

    res.json({
      success: true,
      data: seats
    });

  } catch (err) {
    next(err);
  }
});

// POST /:transportId/seats - add a single seat
router.post('/:transportId/seats', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const transportId = parseInt(req.params.transportId, 10);
    const seat = await transportsService.createSeat(transportId, req.body);

    res.status(201).json({
      success: true,
      data: seat
    });

  } catch (err) {
    next(err);
  }
});

// POST /:transportId/seats/generate - generate multiple seats
router.post('/:transportId/seats/generate', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const transportId = parseInt(req.params.transportId, 10);
    const count = req.body.count || 1;

    const seats = await transportsService.generateSeats(transportId, count);

    res.status(201).json({
      success: true,
      data: seats
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
