// modules/services/services.routes.js
// Express router for service endpoints

const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { ROLES } = require('../../shared/constants');
const servicesService = require('./services.service');

const router = express.Router();

// GET / - list all services
router.get('/', authenticate, async function (req, res, next) {
  try {
    const services = await servicesService.getAllServices();

    res.json({
      success: true,
      data: services
    });

  } catch (err) {
    next(err);
  }
});

// POST / - create a new service
router.post('/', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const service = await servicesService.createService(req.body);

    res.status(201).json({
      success: true,
      data: service
    });

  } catch (err) {
    next(err);
  }
});

// PATCH /:serviceId - update a service
router.patch('/:serviceId', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const serviceId = parseInt(req.params.serviceId, 10);
    const updated = await servicesService.updateService(serviceId, req.body);

    res.json({
      success: true,
      data: updated
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
