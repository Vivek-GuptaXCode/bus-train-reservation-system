import httpClient from './httpClient';

// ========== Routes ==========
// these are for managing bus/train routes and their stops

// get all routes
export const getRoutes = async () => {
  const res = await httpClient.get('/routes');
  return res.data;
};

// get one route
export const getRoute = (id) => {
  return httpClient.get(`/routes/${id}`).then(res => res.data);
};

// create route
export const createRoute = async (data) => {
  const res = await httpClient.post('/routes', data);
  return res.data;
};

// update a route (partial update)
// FIXME: sometimes patch doesn't update all fields, maybe use put?
export const updateRoute = (id, data) => {
  return httpClient.patch(`/routes/${id}`, data).then(res => res.data);
};

// delete a route - be careful, this cascades!
export const deleteRoute = async (id) => {
  const res = await httpClient.delete(`/routes/${id}`);
  return res.data;
};

// ========== Route Stops ==========

// get stops for a specific route
export const getRouteStops = (routeId) => {
  return httpClient.get(`/routes/${routeId}/stops`).then(res => res.data);
};

// add a stop to a route
export const createRouteStop = async (routeId, data) => {
  const res = await httpClient.post(`/routes/${routeId}/stops`, data);
  return res.data;
};

// edit a route stop
export const updateRouteStop = (routeStopId, data) => {
  return httpClient.patch(`/routes/route-stops/${routeStopId}`, data).then(res => res.data);
};

// remove a stop from a route
export const deleteRouteStop = async (routeStopId) => {
  const res = await httpClient.delete(`/routes/route-stops/${routeStopId}`);
  return res.data;
};

// ========== Transports ==========

// get all transports (buses/trains)
export const getTransports = async () => {
  const res = await httpClient.get('/transports');
  return res.data;
};

// get one transport by id
export const getTransport = (id) => {
  return httpClient.get(`/transports/${id}`).then(res => res.data);
};

// add a new transport to the fleet
export const createTransport = async (data) => {
  const res = await httpClient.post('/transports', data);
  return res.data;
};

// update transport details
export const updateTransport = (id, data) => {
  return httpClient.patch(`/transports/${id}`, data).then(res => res.data);
};

// remove a transport
export const deleteTransport = async (id) => {
  const res = await httpClient.delete(`/transports/${id}`);
  return res.data;
};

// get all seats in a transport
// TODO: this returns way too much data sometimes, need pagination
export const getTransportSeats = (transportId) => {
  return httpClient.get(`/transports/${transportId}/seats`).then(res => res.data);
};

// auto-generate seats for a transport based on its capacity
export const generateSeats = async (transportId) => {
  const res = await httpClient.post(`/transports/${transportId}/seats/generate`);
  // console.log('generated seats res:', res);
  return res.data;
};

// ========== Services ==========

// get all services
export const getServices = async () => {
  const res = await httpClient.get('/services');
  return res.data;
};

// get one service
export const getService = (id) => {
  return httpClient.get(`/services/${id}`).then(res => res.data);
};

// create a new service
export const createService = async (data) => {
  const res = await httpClient.post('/services', data);
  return res.data;
};

// update service info
export const updateService = (id, data) => {
  return httpClient.patch(`/services/${id}`, data).then(res => res.data);
};

// delete a service
export const deleteService = async (id) => {
  const res = await httpClient.delete(`/services/${id}`);
  return res.data;
};

// ========== Service Runs ==========

// get all service runs
export const getServiceRuns = async () => {
  const res = await httpClient.get('/service-runs');
  return res.data;
};

// get one service run
export const getServiceRun = (id) => {
  return httpClient.get(`/service-runs/${id}`).then(res => res.data);
};

// schedule a new service run
export const createServiceRun = async (data) => {
  const res = await httpClient.post('/service-runs', data);
  return res.data;
};

// update a scheduled run
export const updateServiceRun = (id, data) => {
  return httpClient.patch(`/service-runs/${id}`, data).then(res => res.data);
};

// cancel/delete a service run
export const deleteServiceRun = async (id) => {
  const res = await httpClient.delete(`/service-runs/${id}`);
  return res.data;
};
