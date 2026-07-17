// modules/services/services.service.js
// Handles database operations for services

const pool = require('../../db/pool');
const { notFound } = require('../../shared/errors');

/**
 * Get all services with their route info joined
 */
async function getAllServices() {
  const result = await pool.query(
    `SELECT s.*, r.route_name
     FROM service s
     JOIN route r ON r.route_id = s.route_id
     ORDER BY s.service_name`
  );

  return result.rows;
}

/**
 * Get a single service by ID with route info
 */
async function getServiceById(serviceId) {
  const result = await pool.query(
    `SELECT s.*, r.route_name, r.total_distance
     FROM service s
     JOIN route r ON r.route_id = s.route_id
     WHERE s.service_id = $1`,
    [serviceId]
  );

  if (result.rows.length === 0) {
    throw notFound('Service not found');
  }

  return result.rows[0];
}

/**
 * Create a new service
 * @param {Object} data - { service_name, service_type, status, route_id }
 */
async function createService(data) {
  const { service_name, service_type, status, route_id } = data;

  const result = await pool.query(
    `INSERT INTO service (service_name, service_type, status, route_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [service_name, service_type, status, route_id]
  );

  return result.rows[0];
}

/**
 * Update an existing service
 */
async function updateService(serviceId, updates) {
  // Check service exists
  const checkResult = await pool.query(
    'SELECT * FROM service WHERE service_id = $1',
    [serviceId]
  );

  if (checkResult.rows.length === 0) {
    throw notFound('Service not found');
  }

  const existing = checkResult.rows[0];

  // Build dynamic update
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.service_name !== undefined) {
    fields.push('service_name = $' + paramIndex);
    values.push(updates.service_name);
    paramIndex++;
  }

  if (updates.service_type !== undefined) {
    fields.push('service_type = $' + paramIndex);
    values.push(updates.service_type);
    paramIndex++;
  }

  if (updates.status !== undefined) {
    fields.push('status = $' + paramIndex);
    values.push(updates.status);
    paramIndex++;
  }

  if (updates.route_id !== undefined) {
    fields.push('route_id = $' + paramIndex);
    values.push(updates.route_id);
    paramIndex++;
  }

  if (fields.length === 0) {
    return existing;
  }

  values.push(serviceId);

  const result = await pool.query(
    `UPDATE service SET ${fields.join(', ')} WHERE service_id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
}

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService
};
