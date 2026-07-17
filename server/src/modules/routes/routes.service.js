// modules/routes/routes.service.js
// Handles database operations for routes and route stops

const pool = require('../../db/pool');
const { notFound, conflict } = require('../../shared/errors');

/**
 * Get all routes, ordered by name
 */
async function getAllRoutes() {
  const result = await pool.query(
    'SELECT * FROM route ORDER BY route_name'
  );
  return result.rows;
}

/**
 * Get a single route by ID, including its stops
 */
async function getRouteById(routeId) {
  // First get the route itself
  const routeResult = await pool.query(
    'SELECT * FROM route WHERE route_id = $1',
    [routeId]
  );

  if (routeResult.rows.length === 0) {
    throw notFound('Route not found');
  }

  const route = routeResult.rows[0];

  // Then get the stops for this route
  const stopsResult = await pool.query(
    'SELECT * FROM route_stop WHERE route_id = $1 ORDER BY stop_sequence',
    [routeId]
  );

  // Attach stops to the route object
  route.stops = stopsResult.rows;

  return route;
}

/**
 * Create a new route
 * @param {Object} data - { route_name, total_distance }
 */
async function createRoute(data) {
  const { route_name, total_distance } = data;

  const result = await pool.query(
    `INSERT INTO route (route_name, total_distance)
     VALUES ($1, $2)
     RETURNING *`,
    [route_name, total_distance]
  );

  return result.rows[0];
}

/**
 * Update an existing route
 */
async function updateRoute(routeId, updates) {
  // Check route exists first
  const checkResult = await pool.query(
    'SELECT * FROM route WHERE route_id = $1',
    [routeId]
  );

  if (checkResult.rows.length === 0) {
    throw notFound('Route not found');
  }

  const existing = checkResult.rows[0];

  // Build update query dynamically based on what's provided
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.route_name !== undefined) {
    fields.push('route_name = $' + paramIndex);
    values.push(updates.route_name);
    paramIndex++;
  }

  if (updates.total_distance !== undefined) {
    fields.push('total_distance = $' + paramIndex);
    values.push(updates.total_distance);
    paramIndex++;
  }

  if (fields.length === 0) {
    // Nothing to update, just return existing
    return existing;
  }

  values.push(routeId);

  const result = await pool.query(
    `UPDATE route SET ${fields.join(', ')} WHERE route_id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * Get all stops for a route, ordered by stop_sequence
 */
async function getRouteStops(routeId) {
  // Check route exists
  const routeCheck = await pool.query(
    'SELECT route_id FROM route WHERE route_id = $1',
    [routeId]
  );

  if (routeCheck.rows.length === 0) {
    throw notFound('Route not found');
  }

  const result = await pool.query(
    'SELECT * FROM route_stop WHERE route_id = $1 ORDER BY stop_sequence',
    [routeId]
  );

  return result.rows;
}

/**
 * Create a new route stop for a route
 * @param {number} routeId
 * @param {Object} data - { stop_name, stop_sequence, distance_from_origin, arrival_time, departure_time }
 */
async function createRouteStop(routeId, data) {
  const { stop_name, stop_sequence, distance_from_origin, arrival_time, departure_time } = data;

  // Make sure the route exists
  const routeCheck = await pool.query(
    'SELECT route_id FROM route WHERE route_id = $1',
    [routeId]
  );

  if (routeCheck.rows.length === 0) {
    throw notFound('Route not found');
  }

  const result = await pool.query(
    `INSERT INTO route_stop (stop_name, stop_sequence, distance_from_origin, arrival_time, departure_time, route_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [stop_name, stop_sequence, distance_from_origin, arrival_time || null, departure_time || null, routeId]
  );

  return result.rows[0];
}

/**
 * Update an existing route stop
 */
async function updateRouteStop(routeStopId, updates) {
  // Check stop exists
  const checkResult = await pool.query(
    'SELECT * FROM route_stop WHERE route_stop_id = $1',
    [routeStopId]
  );

  if (checkResult.rows.length === 0) {
    throw notFound('Route stop not found');
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.stop_name !== undefined) {
    fields.push('stop_name = $' + paramIndex);
    values.push(updates.stop_name);
    paramIndex++;
  }

  if (updates.stop_sequence !== undefined) {
    fields.push('stop_sequence = $' + paramIndex);
    values.push(updates.stop_sequence);
    paramIndex++;
  }

  if (updates.distance_from_origin !== undefined) {
    fields.push('distance_from_origin = $' + paramIndex);
    values.push(updates.distance_from_origin);
    paramIndex++;
  }

  if (updates.arrival_time !== undefined) {
    fields.push('arrival_time = $' + paramIndex);
    values.push(updates.arrival_time);
    paramIndex++;
  }

  if (updates.departure_time !== undefined) {
    fields.push('departure_time = $' + paramIndex);
    values.push(updates.departure_time);
    paramIndex++;
  }

  if (fields.length === 0) {
    return checkResult.rows[0];
  }

  values.push(routeStopId);

  const result = await pool.query(
    `UPDATE route_stop SET ${fields.join(', ')} WHERE route_stop_id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * Delete a route stop.
 * Only allowed if no bookings reference this stop.
 */
async function deleteRouteStop(routeStopId) {
  // Check stop exists
  const checkResult = await pool.query(
    'SELECT * FROM route_stop WHERE route_stop_id = $1',
    [routeStopId]
  );

  if (checkResult.rows.length === 0) {
    throw notFound('Route stop not found');
  }

  // Check if any bookings use this stop as boarding or disembarking
  const bookingCheck = await pool.query(
    `SELECT booking_id FROM booking
     WHERE boarding_stop_id = $1 OR disembarking_stop_id = $1
     LIMIT 1`,
    [routeStopId]
  );

  if (bookingCheck.rows.length > 0) {
    throw conflict('Cannot delete stop: it is referenced by existing bookings');
  }

  // Safe to delete
  await pool.query(
    'DELETE FROM route_stop WHERE route_stop_id = $1',
    [routeStopId]
  );

  return { deleted: true, routeStopId: routeStopId };
}

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  getRouteStops,
  createRouteStop,
  updateRouteStop,
  deleteRouteStop
};
