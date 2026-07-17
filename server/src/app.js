// app.js
// Main Express application setup
// All middleware and route mounting happens here

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config/env');
const requestIdMiddleware = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');

// Import all route modules
const authRoutes = require('./modules/auth/auth.routes');
const routesRoutes = require('./modules/routes/routes.routes');
const transportsRoutes = require('./modules/transports/transports.routes');
const servicesRoutes = require('./modules/services/services.routes');
const serviceRunsRoutes = require('./modules/serviceRuns/serviceRuns.routes');
const searchRoutes = require('./modules/search/search.routes');
const bookingsRoutes = require('./modules/bookings/bookings.routes');
const ticketsRoutes = require('./modules/tickets/tickets.routes');

// Create the Express app
const app = express();

// --- Global Middleware ---

// Security headers (helmet adds a bunch of useful ones)
app.use(helmet());

// CORS - only allow requests from our frontend
app.use(
  cors({
    origin: config.CLIENT_ORIGIN,
    credentials: true,
  })
);

// Parse JSON request bodies (limit to 1mb to prevent abuse)
app.use(express.json({ limit: '1mb' }));

// Attach a unique request ID to every request
app.use(requestIdMiddleware);

// --- Routes ---

// Health check endpoint - useful for monitoring
app.get('/api/health', function (req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Mount all API route modules
// Each module handles its own /api/v1/ prefix internally via the router
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/routes', routesRoutes);
app.use('/api/v1/transports', transportsRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/service-runs', serviceRunsRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/tickets', ticketsRoutes);

// --- Error Handling ---

// 404 handler for routes that don't exist
// This runs if no route matched
app.use(function (req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found: ' + req.method + ' ' + req.originalUrl,
    },
    meta: {
      requestId: req.requestId || null,
      timestamp: new Date().toISOString(),
    },
  });
});

// Global error handler - must be the last middleware
app.use(errorHandler);

module.exports = app;
