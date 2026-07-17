// modules/serviceRuns/serviceRuns.service.js
// Handles database operations for service runs

const pool = require('../../db/pool');
const { notFound, badRequest, conflict } = require('../../shared/errors');

// get all service runs with joined info about service, transport, and route
async function getAllServiceRuns() {
  const result = await pool.query(
    `SELECT sr.*, s.service_name, s.service_type,
            t.transport_number, t.transport_type AS transport_type_used,
            r.route_name, r.total_distance
     FROM service_run sr
     JOIN service s ON s.service_id = sr.service_id
     JOIN transport t ON t.transport_id = sr.transport_id
     JOIN route r ON r.route_id = s.route_id
     ORDER BY sr.departure_time DESC`
  );

  return result.rows;
}

// create a new service run - validates service type matches transport type
async function createServiceRun(data) {
  const { run_id, departure_time, arrival_time, status, transport_id, service_id } = data;

  // Validate service type matches transport type
  const serviceResult = await pool.query(
    'SELECT service_id, service_type, route_id FROM service WHERE service_id = $1',
    [service_id]
  );

  if (serviceResult.rows.length === 0) {
    throw notFound('Service not found');
  }

  const service = serviceResult.rows[0];

  const transportResult = await pool.query(
    'SELECT transport_id, transport_type FROM transport WHERE transport_id = $1',
    [transport_id]
  );

  if (transportResult.rows.length === 0) {
    throw notFound('Transport not found');
  }

  const transport = transportResult.rows[0];

  // Service type and transport type must match
  // e.g. Bus service can only use Bus transport
  if (service.service_type !== transport.transport_type) {
    throw badRequest(
      'Service type (' + service.service_type + ') does not match transport type (' +
      transport.transport_type + ')'
    );
  }

  // Check for overlapping runs on the same transport
  // A transport can't be in two places at once!
  // We check if there's an existing run for this transport
  // where the times overlap with the new run
  const overlapResult = await pool.query(
    `SELECT service_run_id, run_id, departure_time, arrival_time
     FROM service_run
     WHERE transport_id = $1
       AND status <> 'Cancelled'
       AND $2::timestamptz < arrival_time
       AND $3::timestamptz > departure_time
     LIMIT 1`,
    [transport_id, departure_time, arrival_time]
  );

  if (overlapResult.rows.length > 0) {
    var existing = overlapResult.rows[0];
    throw conflict(
      'Transport is already assigned to run "' + existing.run_id +
      '" during the requested time period (' +
      existing.departure_time + ' to ' + existing.arrival_time + ')'
    );
  }

  // Insert the service run
  const result = await pool.query(
    `INSERT INTO service_run (run_id, departure_time, arrival_time, status, transport_id, service_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [run_id, departure_time, arrival_time, status, transport_id, service_id]
  );

  return result.rows[0];
}

// update a service run
async function updateServiceRun(serviceRunId, updates) {
  // Check service run exists
  const checkResult = await pool.query(
    'SELECT * FROM service_run WHERE service_run_id = $1',
    [serviceRunId]
  );

  if (checkResult.rows.length === 0) {
    throw notFound('Service run not found');
  }

  const existing = checkResult.rows[0];

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.run_id !== undefined) {
    fields.push('run_id = $' + paramIndex);
    values.push(updates.run_id);
    paramIndex++;
  }

  if (updates.departure_time !== undefined) {
    fields.push('departure_time = $' + paramIndex);
    values.push(updates.departure_time);
    paramIndex++;
  }

  if (updates.arrival_time !== undefined) {
    fields.push('arrival_time = $' + paramIndex);
    values.push(updates.arrival_time);
    paramIndex++;
  }

  if (updates.status !== undefined) {
    fields.push('status = $' + paramIndex);
    values.push(updates.status);
    paramIndex++;
  }

  if (updates.transport_id !== undefined) {
    fields.push('transport_id = $' + paramIndex);
    values.push(updates.transport_id);
    paramIndex++;
  }

  if (updates.service_id !== undefined) {
    fields.push('service_id = $' + paramIndex);
    values.push(updates.service_id);
    paramIndex++;
  }

  if (fields.length === 0) {
    return existing;
  }

  values.push(serviceRunId);

  const result = await pool.query(
    `UPDATE service_run SET ${fields.join(', ')} WHERE service_run_id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
}

module.exports = {
  getAllServiceRuns,
  createServiceRun,
  updateServiceRun
};
