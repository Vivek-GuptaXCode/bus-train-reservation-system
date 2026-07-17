import httpClient from './httpClient';

// FIXME: need to handle what happens when booking fails partway through
// like what if payment goes through but ticket generation fails?

// confirm a booking - this creates booking + tickets together
// data should have selected seats, passenger info, service run info, etc
export const confirmBooking = (data) => {
  // console.log('confirming booking with data:', data);
  return httpClient.post('/bookings/confirm', data)
    .then(res => res.data);
};

// get booking details by id
export const getBooking = async (id) => {
  const res = await httpClient.get(`/bookings/${id}`);
  return res.data;
};

// get all bookings for a passenger
export const getPassengerBookings = (passengerId) => {
  return httpClient.get(`/bookings/passengers/${passengerId}/bookings`)
    .then(res => res.data);
};

// get a single ticket
// TODO: add error handling for when ticket doesn't exist
export const getTicket = async (id) => {
  const res = await httpClient.get(`/tickets/${id}`);
  return res.data;
};

// cancel a ticket with a reason
export const cancelTicket = (ticketId, reason) => {
  return httpClient.post(`/tickets/${ticketId}/cancel`, { reason })
    .then(res => res.data);
};
