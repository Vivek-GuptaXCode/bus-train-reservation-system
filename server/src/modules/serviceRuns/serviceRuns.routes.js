// modules/serviceRuns/serviceRuns.routes.js
// Express router for service run endpoints

const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { ROLES } = require('../../shared/constants');
const serviceRunsService = require('./serviceRuns.service');

const router = express.Router();

// GET / - list all service runs
router.get('/', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const serviceRuns = await serviceRunsService.getAllServiceRuns();

    res.json({
      success: true,
      data: serviceRuns
    });

  } catch (err) {
    next(err);
  }
});

// POST / - create a new service run
router.post('/', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const serviceRun = await serviceRunsService.createServiceRun(req.body);

    res.status(201).json({
      success: true,
      data: serviceRun
    });

  } catch (err) {
    next(err);
  }
});

// PATCH /:serviceRunId - update a service run
router.patch('/:serviceRunId', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const serviceRunId = parseInt(req.params.serviceRunId, 10);
    const updated = await serviceRunsService.updateServiceRun(serviceRunId, req.body);

    res.json({
      success: true,
      data: updated
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
