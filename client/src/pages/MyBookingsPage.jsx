import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPassengerBookings } from '../api/bookingApi';

// Shows all bookings for the logged-in passenger
const MyBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      const passengerId = user?.id || user?.passenger_id;
      if (!passengerId) {
        setError('Could not determine passenger ID');
        setLoading(false);
        return;
      }

      try {
        const data = await getPassengerBookings(passengerId);
        // Handle different response formats
        const list = Array.isArray(data) ? data : data.bookings || [];
        setBookings(list);
      } catch (err) {
        console.log('Failed to load bookings:', err);
        setError('Failed to load your bookings.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  if (loading) {
    return <div className="loading">Loading your bookings...</div>;
  }

  if (error) {
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 className="page-title">My Bookings</h2>

      {bookings.length === 0 ? (
        <div className="card text-center">
          <p>You don't have any bookings yet.</p>
          <button className="btn btn-primary mt-2" onClick={() => navigate('/search')}>
            Search for a Journey
          </button>
        </div>
      ) : (
        <div>
          {bookings.map((booking) => (
            <div
              className="card"
              key={booking.id || booking.booking_id}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/bookings/${booking.id || booking.booking_id}`)}
            >
              <div className="flex-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <h4>Booking #{booking.id || booking.booking_id}</h4>
                  <p><strong>Service:</strong> {booking.service_name || 'N/A'}</p>
                  <p><strong>Date:</strong> {booking.travel_date ? new Date(booking.travel_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={booking.status === 'Cancelled' ? 'error-text' : 'success-text'}>
                      {booking.status || 'Confirmed'}
                    </span>
                  </p>
                  <p><strong>Tickets:</strong> {booking.ticket_count || (booking.tickets ? booking.tickets.length : 0)}</p>
                  <p><strong>Total:</strong> ₹{booking.total_fare || 'N/A'}</p>
                </div>
              </div>
              <small style={{ color: '#666' }}>Click to view details</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
