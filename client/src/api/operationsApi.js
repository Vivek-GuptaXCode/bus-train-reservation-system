import httpClient from './httpClient';

// ========== Routes ==========

/**
 * Get all routes
 */
export const getRoutes = async () => {
  const response = await httpClient.get('/routes');
  return response.data;
};

/**
 * Get a single route by ID
 */
export const getRoute = async (id) => {
  const response = await httpClient.get(`/routes/${id}`);
  return response.data;
};

/**
 * Create a new route
 */
export const createRoute = async (data) => {
  const response = await httpClient.post('/routes', data);
  return response.data;
};

/**
 * Update a route
 */
export const updateRoute = async (id, data) => {
  const response = await httpClient.patch(`/routes/${id}`, data);
  return response.data;
};

/**
 * Delete a route
 */
export const deleteRoute = async (id) => {
  const response = await httpClient.delete(`/routes/${id}`);
  return response.data;
};

// ========== Route Stops ==========

/**
 * Get stops for a route
 */
export const getRouteStops = async (routeId) => {
  const response = await httpClient.get(`/routes/${routeId}/stops`);
  return response.data;
};

/**
 * Create a stop on a route
 */
export const createRouteStop = async (routeId, data) => {
  const response = await httpClient.post(`/routes/${routeId}/stops`, data);
  return response.data;
};

/**
 * Update a route stop
 */
export const updateRouteStop = async (routeStopId, data) => {
  const response = await httpClient.patch(`/routes/route-stops/${routeStopId}`, data);
  return response.data;
};

/**
 * Delete a route stop
 */
export const deleteRouteStop = async (routeStopId) => {
  const response = await httpClient.delete(`/routes/route-stops/${routeStopId}`);
  return response.data;
};

// ========== Transports ==========

/**
 * Get all transports
 */
export const getTransports = async () => {
  const response = await httpClient.get('/transports');
  return response.data;
};

/**
 * Get a single transport
 */
export const getTransport = async (id) => {
  const response = await httpClient.get(`/transports/${id}`);
  return response.data;
};

/**
 * Create a new transport
 */
export const createTransport = async (data) => {
  const response = await httpClient.post('/transports', data);
  return response.data;
};

/**
 * Update a transport
 */
export const updateTransport = async (id, data) => {
  const response = await httpClient.patch(`/transports/${id}`, data);
  return response.data;
};

/**
 * Delete a transport
 */
export const deleteTransport = async (id) => {
  const response = await httpClient.delete(`/transports/${id}`);
  return response.data;
};

/**
 * Get seats for a transport
 */
export const getTransportSeats = async (transportId) => {
  const response = await httpClient.get(`/transports/${transportId}/seats`);
  return response.data;
};

/**
 * Generate seats for a transport
 */
export const generateSeats = async (transportId) => {
  const response = await httpClient.post(`/transports/${transportId}/seats/generate`);
  return response.data;
};

// ========== Services ==========

/**
 * Get all services
 */
export const getServices = async () => {
  const response = await httpClient.get('/services');
  return response.data;
};

/**
 * Get a single service
 */
export const getService = async (id) => {
  const response = await httpClient.get(`/services/${id}`);
  return response.data;
};

/**
 * Create a service
 */
export const createService = async (data) => {
  const response = await httpClient.post('/services', data);
  return response.data;
};

/**
 * Update a service
 */
export const updateService = async (id, data) => {
  const response = await httpClient.patch(`/services/${id}`, data);
  return response.data;
};

/**
 * Delete a service
 */
export const deleteService = async (id) => {
  const response = await httpClient.delete(`/services/${id}`);
  return response.data;
};

// ========== Service Runs ==========

/**
 * Get all service runs
 */
export const getServiceRuns = async () => {
  const response = await httpClient.get('/service-runs');
  return response.data;
};

/**
 * Get a single service run
 */
export const getServiceRun = async (id) => {
  const response = await httpClient.get(`/service-runs/${id}`);
  return response.data;
};

/**
 * Create a service run
 */
export const createServiceRun = async (data) => {
  const response = await httpClient.post('/service-runs', data);
  return response.data;
};

/**
 * Update a service run
 */
export const updateServiceRun = async (id, data) => {
  const response = await httpClient.patch(`/service-runs/${id}`, data);
  return response.data;
};

/**
 * Delete a service run
 */
export const deleteServiceRun = async (id) => {
  const response = await httpClient.delete(`/service-runs/${id}`);
  return response.data;
};
