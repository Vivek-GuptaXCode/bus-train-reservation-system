// modules/transports/transports.service.js
// Handles database operations for transports and seats

const pool = require('../../db/pool');
const { notFound, conflict } = require('../../shared/errors');

// get all transports
async function getAllTransports() {
  const result = await pool.query(
    'SELECT * FROM transport ORDER BY transport_number'
  );
  return result.rows;
}

// get a transport by ID, including its seats
async function getTransportById(transportId) {
  const transportResult = await pool.query(
    'SELECT * FROM transport WHERE transport_id = $1',
    [transportId]
  );

  if (transportResult.rows.length === 0) {
    throw notFound('Transport not found');
  }

  const transport = transportResult.rows[0];

  // Also get the seats for this transport
  const seatsResult = await pool.query(
    'SELECT * FROM seat WHERE transport_id = $1 ORDER BY seat_no',
    [transportId]
  );

  transport.seats = seatsResult.rows;

  return transport;
}

// create a new transport
async function createTransport(data) {
  const { transport_type, transport_number, capacity } = data;

  const result = await pool.query(
    `INSERT INTO transport (transport_type, transport_number, capacity)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [transport_type, transport_number, capacity]
  );

  return result.rows[0];
}

// update a transport
async function updateTransport(transportId, updates) {
  // Check transport exists
  const checkResult = await pool.query(
    'SELECT * FROM transport WHERE transport_id = $1',
    [transportId]
  );

  if (checkResult.rows.length === 0) {
    throw notFound('Transport not found');
  }

  const existing = checkResult.rows[0];

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.transport_type !== undefined) {
    fields.push('transport_type = $' + paramIndex);
    values.push(updates.transport_type);
    paramIndex++;
  }

  if (updates.transport_number !== undefined) {
    fields.push('transport_number = $' + paramIndex);
    values.push(updates.transport_number);
    paramIndex++;
  }

  if (updates.capacity !== undefined) {
    fields.push('capacity = $' + paramIndex);
    values.push(updates.capacity);
    paramIndex++;
  }

  if (fields.length === 0) {
    return existing;
  }

  values.push(transportId);

  const result = await pool.query(
    `UPDATE transport SET ${fields.join(', ')} WHERE transport_id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
}

// get seats for a transport, ordered by seat_no
async function getTransportSeats(transportId) {
  // Check transport exists
  const checkResult = await pool.query(
    'SELECT transport_id, capacity FROM transport WHERE transport_id = $1',
    [transportId]
  );

  if (checkResult.rows.length === 0) {
    throw notFound('Transport not found');
  }

  const result = await pool.query(
    'SELECT * FROM seat WHERE transport_id = $1 ORDER BY seat_no',
    [transportId]
  );

  return result.rows;
}

// create a single seat for a transport - checks capacity first
async function createSeat(transportId, data) {
  const { seat_no } = data;

  // Get transport info to check capacity
  const transportResult = await pool.query(
    'SELECT transport_id, capacity FROM transport WHERE transport_id = $1',
    [transportId]
  );

  if (transportResult.rows.length === 0) {
    throw notFound('Transport not found');
  }

  const transport = transportResult.rows[0];

  // Count existing seats
  const countResult = await pool.query(
    'SELECT COUNT(*) AS seat_count FROM seat WHERE transport_id = $1',
    [transportId]
  );

  const currentSeatCount = parseInt(countResult.rows[0].seat_count, 10);

  // Check if adding one more would exceed capacity
  if (currentSeatCount >= transport.capacity) {
    throw conflict(
      'Transport capacity reached. Current: ' + currentSeatCount + ', Capacity: ' + transport.capacity
    );
  }

  // Insert the seat
  const result = await pool.query(
    `INSERT INTO seat (seat_no, transport_id)
     VALUES ($1, $2)
     RETURNING *`,
    [seat_no, transportId]
  );

  return result.rows[0];
}

// generate seats for a transport - creates seat numbers like 1A, 1B, 2A, etc
async function generateSeats(transportId, count) {
  // Get transport info
  const transportResult = await pool.query(
    'SELECT transport_id, capacity FROM transport WHERE transport_id = $1',
    [transportId]
  );

  if (transportResult.rows.length === 0) {
    throw notFound('Transport not found');
  }

  const transport = transportResult.rows[0];

  // Count existing seats
  const countResult = await pool.query(
    'SELECT COUNT(*) AS seat_count FROM seat WHERE transport_id = $1',
    [transportId]
  );

  const currentSeatCount = parseInt(countResult.rows[0].seat_count, 10);

  // Check capacity
  if (currentSeatCount + count > transport.capacity) {
    throw conflict(
      'Adding ' + count + ' seats would exceed capacity. Current: ' +
      currentSeatCount + ', Capacity: ' + transport.capacity
    );
  }

  // Generate seat numbers
  // Pattern: row number + letter (A, B, C, D, etc.)
  const seats = [];
  const maxColumns = 4; // A, B, C, D per row
  let currentRow = 1;
  let currentCol = 0;

  for (var i = 1; i <= count; i++) {
    // Generate seat number
    const seatLetter = String.fromCharCode(65 + currentCol); // 65 = 'A' in ASCII
    const seatNo = currentRow + seatLetter;

    seats.push(seatNo);

    currentCol++;
    if (currentCol >= maxColumns) {
      currentCol = 0;
      currentRow++;
    }
  }

  // Insert all seats in order
  // FIXME: should probably wrap this in a transaction
  const insertedSeats = [];

  for (var i = 0; i < seats.length; i++) {
    var result = await pool.query(
      `INSERT INTO seat (seat_no, transport_id)
       VALUES ($1, $2)
       RETURNING *`,
      [seats[i], transportId]
    );
    insertedSeats.push(result.rows[0]);
  }

  return insertedSeats;
}

module.exports = {
  getAllTransports,
  getTransportById,
  createTransport,
  updateTransport,
  getTransportSeats,
  createSeat,
  generateSeats
};
