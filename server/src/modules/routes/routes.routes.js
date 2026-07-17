// modules/routes/routes.routes.js
// Express router for route and route-stop endpoints

const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { ROLES } = require('../../shared/constants');
const routesService = require('./routes.service');

const router = express.Router();

// GET / - list all routes (any authenticated user can see routes)
router.get('/', authenticate, async function (req, res, next) {
  try {
    const routes = await routesService.getAllRoutes();

    res.json({
      success: true,
      data: routes
    });

  } catch (err) {
    next(err);
  }
});

// POST / - create a new route (only ops staff and admin)
router.post('/', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const route = await routesService.createRoute(req.body);

    res.status(201).json({
      success: true,
      data: route
    });

  } catch (err) {
    next(err);
  }
});

// GET /:routeId - get a single route with its stops
router.get('/:routeId', authenticate, async function (req, res, next) {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    const route = await routesService.getRouteById(routeId);

    res.json({
      success: true,
      data: route
    });

  } catch (err) {
    next(err);
  }
});

// PATCH /:routeId - update a route
router.patch('/:routeId', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    const updated = await routesService.updateRoute(routeId, req.body);

    res.json({
      success: true,
      data: updated
    });

  } catch (err) {
    next(err);
  }
});

// GET /:routeId/stops - get stops for a route
router.get('/:routeId/stops', authenticate, async function (req, res, next) {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    const stops = await routesService.getRouteStops(routeId);

    res.json({
      success: true,
      data: stops
    });

  } catch (err) {
    next(err);
  }
});

// POST /:routeId/stops - create a stop for a route
router.post('/:routeId/stops', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    const stop = await routesService.createRouteStop(routeId, req.body);

    res.status(201).json({
      success: true,
      data: stop
    });

  } catch (err) {
    next(err);
  }
});

// PATCH /route-stops/:routeStopId - update a route stop
// NOTE: this route is placed at /route-stops/:routeStopId (not nested under :routeId)
// because we can find the stop by its own ID directly
router.patch('/route-stops/:routeStopId', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const routeStopId = parseInt(req.params.routeStopId, 10);
    const updated = await routesService.updateRouteStop(routeStopId, req.body);

    res.json({
      success: true,
      data: updated
    });

  } catch (err) {
    next(err);
  }
});

// DELETE /route-stops/:routeStopId - delete a route stop
router.delete('/route-stops/:routeStopId', authenticate, authorize(ROLES.OPERATIONS_STAFF, ROLES.ADMINISTRATOR), async function (req, res, next) {
  try {
    const routeStopId = parseInt(req.params.routeStopId, 10);
    const result = await routesService.deleteRouteStop(routeStopId);

    res.json({
      success: true,
      data: result
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
