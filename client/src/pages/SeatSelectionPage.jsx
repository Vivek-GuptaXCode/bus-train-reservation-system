import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getSeatAvailability } from '../api/searchApi';
import { confirmBooking } from '../api/bookingApi';
import { useAuth } from '../contexts/AuthContext';

// Seat selection page - shows a grid of seats and lets user pick which ones to book
// TODO: add a legend for seat colors
const SeatSelectionPage = () => {
  const { id: serviceRunId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const boardingStopId = searchParams.get('boardingStopId');
  const disembarkingStopId = searchParams.get('disembarkingStopId');
  const passengerCount = parseInt(searchParams.get('passengerCount'), 10) || 1;

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [passengerNames, setPassengerNames] = useState([]);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const data = await getSeatAvailability(serviceRunId, boardingStopId, disembarkingStopId);
        setSeats(Array.isArray(data) ? data : data.seats || []);
      } catch (err) {
        console.log('Failed to load seats:', err);
        setError('Could not load seat availability.');
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [serviceRunId, boardingStopId, disembarkingStopId]);

  // Initialize passenger names array when passengerCount changes
  useEffect(() => {
    setPassengerNames(new Array(passengerCount).fill(''));
  }, [passengerCount]);

  const toggleSeat = (seatId) => {
    const seat = seats.find((s) => (s.id || s.seat_id) === seatId);
    if (!seat) return;

    // Can't select already booked seats
    if (seat.status === 'booked' || seat.is_booked) return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      // Only allow selecting up to passengerCount seats
      if (prev.length >= passengerCount) {
        return prev;
      }
      return [...prev, seatId];
    });
  };

  const getSeatClass = (seat) => {
    const seatId = seat.id || seat.seat_id;
    const status = seat.status || (seat.is_booked ? 'booked' : 'available');

    if (status === 'booked' || seat.is_booked) return 'seat booked';
    if (selectedSeats.includes(seatId)) return 'seat selected';
    return 'seat available';
  };

  const handlePassengerNameChange = (index, value) => {
    setPassengerNames((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleConfirmBooking = async () => {
    // Validate that we have enough seats and all passenger names
    if (selectedSeats.length !== passengerCount) {
      setError(`Please select exactly ${passengerCount} seat(s)`);
      return;
    }

    if (passengerNames.some((name) => !name.trim())) {
      setError('Please enter names for all passengers');
      return;
    }

    setBookingLoading(true);
    setError('');
    try {
      const bookingData = {
        serviceRunId,
        boardingStopId,
        disembarkingStopId,
        seatIds: selectedSeats,
        passengerNames,
        passengerId: user?.id || user?.passenger_id,
      };

      const result = await confirmBooking(bookingData);
      // Navigate to booking detail page
      const bookingId = result.booking_id || result.id;
      navigate(`/bookings/${bookingId}`);
    } catch (err) {
      console.log('Booking failed:', err);
      setError(err.response?.data?.message || 'Booking failed. Try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading seat map...</div>;
  }

  if (error && seats.length === 0) {
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <p className="error-text">{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 className="page-title">Select Seats</h2>
      <p style={{ color: '#666' }}>
        Please select {passengerCount} seat(s) for your journey.
      </p>

      {error && <p className="error-text">{error}</p>}

      {/* Seat Grid */}
      <div className="card">
        <h3>Available Seats</h3>
        <div className="seat-grid">
          {seats.map((seat) => {
            const seatId = seat.id || seat.seat_id;
            return (
              <div
                key={seatId}
                className={getSeatClass(seat)}
                onClick={() => toggleSeat(seatId)}
                title={`Seat ${seat.seat_number || seatId}`}
              >
                {seat.seat_number || seatId}
              </div>
            );
          })}
        </div>

        <div className="flex-row" style={{ marginTop: '15px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div className="seat available" style={{ width: '25px', height: '25px', fontSize: '10px', cursor: 'default' }}>A</div>
            Available
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div className="seat selected" style={{ width: '25px', height: '25px', fontSize: '10px', cursor: 'default' }}>S</div>
            Selected
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div className="seat booked" style={{ width: '25px', height: '25px', fontSize: '10px', cursor: 'default' }}>B</div>
            Booked
          </span>
        </div>
      </div>

      {/* Passenger Names */}
      {selectedSeats.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>Passenger Details</h3>
          {passengerNames.map((name, index) => (
            <div className="form-group" key={index}>
              <label htmlFor={`passenger-${index}`}>Passenger {index + 1} Name</label>
              <input
                type="text"
                id={`passenger-${index}`}
                className="form-control"
                value={name}
                onChange={(e) => handlePassengerNameChange(index, e.target.value)}
                placeholder={`Name for seat ${selectedSeats[index] || index + 1}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Confirm button */}
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button className="btn btn-secondary" style={{ marginRight: '10px' }} onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleConfirmBooking}
          disabled={bookingLoading || selectedSeats.length !== passengerCount}
        >
          {bookingLoading ? 'Booking...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
};

export default SeatSelectionPage;
