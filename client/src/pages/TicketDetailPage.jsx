import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicket, cancelTicket } from '../api/bookingApi';

// Individual ticket detail view with cancel option
const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await getTicket(id);
        setTicket(data.ticket || data);
      } catch (err) {
        console.log('Failed to load ticket:', err);
        setError('Could not load ticket details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }
    setCancelling(true);
    try {
      await cancelTicket(id, cancelReason);
      // Refresh ticket data
      const data = await getTicket(id);
      setTicket(data.ticket || data);
      setShowCancel(false);
    } catch (err) {
      console.log('Cancellation failed:', err);
      setError(err.response?.data?.message || 'Failed to cancel ticket');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading ticket...</div>;
  }

  if (error) {
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <p className="error-text">{error}</p>
        <button className="btn btn-secondary mt-1" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <p>Ticket not found.</p>
        <button className="btn btn-secondary mt-1" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const isCancelled = ticket.status === 'Cancelled';

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 className="page-title">Ticket Details</h2>

      <div className="card" style={{ borderLeft: `4px solid ${isCancelled ? '#dc3545' : '#28a745'}` }}>
        <div className="flex-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <h3>Ticket #{ticket.id || ticket.ticket_id}</h3>
          <span className={isCancelled ? 'error-text' : 'success-text'} style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {ticket.status || 'Booked'}
          </span>
        </div>

        <div className="flex-row" style={{ marginTop: '15px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <p><strong>Passenger Name:</strong> {ticket.passenger_name || 'N/A'}</p>
            <p><strong>Seat Number:</strong> {ticket.seat_number || 'N/A'}</p>
            <p><strong>Service:</strong> {ticket.service_name || 'N/A'}</p>
            <p><strong>Transport:</strong> {ticket.transport_number || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Departure:</strong> {ticket.departure_time ? new Date(ticket.departure_time).toLocaleString() : 'N/A'}</p>
            <p><strong>Arrival:</strong> {ticket.arrival_time ? new Date(ticket.arrival_time).toLocaleString() : 'N/A'}</p>
            <p><strong>Fare:</strong> ₹{ticket.fare || 'N/A'}</p>
          </div>
        </div>

        {isCancelled && ticket.cancellation_reason && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f8d7da', borderRadius: '5px' }}>
            <strong>Cancellation Reason:</strong> {ticket.cancellation_reason}
          </div>
        )}

        {!isCancelled && !showCancel && (
          <div style={{ marginTop: '15px' }}>
            <button className="btn btn-danger" onClick={() => setShowCancel(true)}>
              Cancel Ticket
            </button>
          </div>
        )}

        {showCancel && (
          <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #dc3545', borderRadius: '5px' }}>
            <h4 style={{ color: '#dc3545' }}>Confirm Cancellation</h4>
            <p>Are you sure you want to cancel this ticket?</p>
            <div className="form-group">
              <label htmlFor="cancelReason">Reason for Cancellation</label>
              <textarea
                id="cancelReason"
                className="form-control"
                rows="3"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason..."
              />
            </div>
            <div className="flex-row">
              <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCancel(false)}>
                No, Keep It
              </button>
            </div>
          </div>
        )}
      </div>

      <button className="btn btn-secondary mt-2" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default TicketDetailPage;
