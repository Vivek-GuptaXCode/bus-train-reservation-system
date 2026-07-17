import httpClient from './httpClient';

/**
 * Confirm a booking (create booking + tickets)
 * @param {Object} data - booking payload with selected seats, passenger info, etc.
 */
export const confirmBooking = async (data) => {
  const response = await httpClient.post('/bookings/confirm', data);
  return response.data;
};

/**
 * Get a booking by its ID
 */
export const getBooking = async (id) => {
  const response = await httpClient.get(`/bookings/${id}`);
  return response.data;
};

/**
 * Get all bookings for a specific passenger
 */
export const getPassengerBookings = async (passengerId) => {
  const response = await httpClient.get(`/bookings/passengers/${passengerId}/bookings`);
  return response.data;
};

/**
 * Get a single ticket by ID
 */
export const getTicket = async (id) => {
  const response = await httpClient.get(`/tickets/${id}`);
  return response.data;
};

/**
 * Cancel a ticket with a reason
 */
export const cancelTicket = async (ticketId, reason) => {
  const response = await httpClient.post(`/tickets/${ticketId}/cancel`, { reason });
  return response.data;
};
