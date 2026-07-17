// modules/auth/auth.routes.js
// Handles authentication - register, login, and getting current user info

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db/pool');
const config = require('../../config/env');
const { authenticate } = require('../../middleware/authenticate');
const { AppError, badRequest, conflict } = require('../../shared/errors');
const { ROLES } = require('../../shared/constants');

const router = express.Router();

// POST /register - creates a new passenger account
// Takes { name, password, fullName, phone, email, gender, age }
router.post('/register', async function (req, res, next) {
  try {
    const { name, password, fullName, phone, email, gender, age } = req.body;

    // TODO: add proper validation with Joi schema
    if (!name || !password || !fullName || !phone || !email) {
      throw badRequest('Missing required fields: name, password, fullName, phone, email');
    }

    // Hash the password before storing it
    // Using cost factor 12 as specified
    const passwordHash = await bcrypt.hash(password, 12);

    // We need a client for the transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Find the Passenger role_id first
      const roleResult = await client.query(
        'SELECT role_id FROM role WHERE role_name = $1',
        [ROLES.PASSENGER]
      );

      if (roleResult.rows.length === 0) {
        throw new AppError('Passenger role not found in database', 500);
      }

      const passengerRoleId = roleResult.rows[0].role_id;

      // Insert into user_account
      const userResult = await client.query(
        `INSERT INTO user_account (name, password_hash, full_name, phone, role_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING user_id, name, full_name`,
        [name, passwordHash, fullName, phone, passengerRoleId]
      );

      const newUser = userResult.rows[0];

      // Insert into passenger table
      // passenger name is the same as full_name for simplicity
      const passengerResult = await client.query(
        `INSERT INTO passenger (name, phone, email, gender, age, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING p_id`,
        [fullName, phone, email, gender || null, age || null, newUser.user_id]
      );

      const newPassenger = passengerResult.rows[0];

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: {
          userId: newUser.user_id,
          passengerId: newPassenger.p_id,
          userName: newUser.name,
          fullName: newUser.full_name
        }
      });

    } catch (err) {
      await client.query('ROLLBACK');

      // Check for unique constraint violations
      if (err.code === '23505') {
        // PostgreSQL unique violation
        if (err.constraint === 'user_account_name_key' || err.detail.includes('name')) {
          throw conflict('Username already taken');
        }
        if (err.constraint === 'uq_passenger_email' || err.detail.includes('email')) {
          throw conflict('Email already registered');
        }
        throw conflict('A record with these details already exists');
      }

      throw err;
    } finally {
      client.release();
    }

  } catch (err) {
    next(err);
  }
});

// POST /login - authenticates user and returns JWT token
// Takes { name, password }
router.post('/login', async function (req, res, next) {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      throw badRequest('Username and password are required');
    }

    // Find the user by name
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.password_hash, u.full_name, r.role_name
       FROM user_account u
       JOIN role r ON r.role_id = u.role_id
       WHERE u.name = $1`,
      [name]
    );

    const user = result.rows[0];

    if (!user) {
      throw badRequest('Invalid username or password');
    }

    // Compare password with hashed version
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw badRequest('Invalid username or password');
    }

    // Create JWT token
    // sub is the user_id, plus role and name for convenience
    const tokenPayload = {
      sub: user.user_id,
      role: user.role_name,
      name: user.name
    };

    const token = jwt.sign(tokenPayload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    res.json({
      success: true,
      data: {
        token: token,
        user: {
          user_id: user.user_id,
          name: user.name,
          full_name: user.full_name,
          role: user.role_name
        }
      }
    });

  } catch (err) {
    next(err);
  }
});

// GET /me - returns info about the currently logged in user
router.get('/me', authenticate, async function (req, res, next) {
  try {
    // req.user is set by the authenticate middleware
    // It has { userId, role, name } from the JWT
    const { userId } = req.user;

    // Fetch full user details from database
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.full_name, u.phone, r.role_name,
              p.p_id AS passenger_id, p.email, p.gender, p.age
       FROM user_account u
       JOIN role r ON r.role_id = u.role_id
       LEFT JOIN passenger p ON p.user_id = u.user_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        userId: user.user_id,
        name: user.name,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role_name,
        passengerId: user.passenger_id,
        email: user.email,
        gender: user.gender,
        age: user.age
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
