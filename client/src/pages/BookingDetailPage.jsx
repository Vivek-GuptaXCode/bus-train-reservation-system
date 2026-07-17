import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBooking } from '../api/bookingApi';

// Shows booking details including all tickets
const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await getBooking(id);
        setBooking(data.booking || data);
      } catch (err) {
        console.log('Failed to load booking:', err);
        setError('Could not load booking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading booking details...</div>;
  }

  if (error) {
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <p className="error-text">{error}</p>
        <button className="btn btn-secondary mt-1" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <p>Booking not found.</p>
        <button className="btn btn-secondary mt-1" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const tickets = booking.tickets || [];
  const status = booking.status || 'Confirmed';

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 className="page-title">Booking Details</h2>

      <div className="card">
        <h3>Booking #{booking.id || booking.booking_id}</h3>
        <div className="flex-row" style={{ marginTop: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <p><strong>Status:</strong> <span className="success-text">{status}</span></p>
            <p><strong>Booking Date:</strong> {new Date(booking.booking_date || booking.created_at).toLocaleString()}</p>
            <p><strong>Travel Date:</strong> {new Date(booking.travel_date || booking.journey_date).toLocaleDateString()}</p>
            <p><strong>Service:</strong> {booking.service_name || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Total Fare:</strong> ₹{booking.total_fare || booking.fare || 'N/A'}</p>
            <p><strong>Passengers:</strong> {tickets.length}</p>
          </div>
        </div>
      </div>

      {/* Tickets list */}
      <h3 style={{ marginTop: '20px' }}>Tickets</h3>
      {tickets.length === 0 ? (
        <p>No tickets found for this booking.</p>
      ) : (
        <div>
          {tickets.map((ticket, index) => (
            <div className="card" key={ticket.id || ticket.ticket_id || index}>
              <div className="flex-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <p><strong>Ticket #{ticket.id || ticket.ticket_id}</strong></p>
                  <p><strong>Passenger:</strong> {ticket.passenger_name || 'N/A'}</p>
                  <p><strong>Seat:</strong> {ticket.seat_number || 'N/A'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={ticket.status === 'Cancelled' ? 'error-text' : 'success-text'}>
                      {ticket.status || 'Booked'}
                    </span>
                  </p>
                  <p><strong>Fare:</strong> ₹{ticket.fare || 'N/A'}</p>
                  <Link
                    to={`/tickets/${ticket.id || ticket.ticket_id}`}
                    className="btn btn-secondary"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    View Ticket
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-secondary mt-2" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default BookingDetailPage;
