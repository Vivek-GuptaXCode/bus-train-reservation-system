import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoutes, getRouteStops } from '../api/operationsApi';
import { searchServiceRuns } from '../api/searchApi';
import { confirmBooking } from '../api/bookingApi';
import SearchForm from '../components/search/SearchForm';
import ServiceRunCard from '../components/search/ServiceRunCard';

// Booking clerk page - they search for a service and book for walk-in passengers
// Basically the same workflow as search but clerk handles passenger details
const ClerkNewBookingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [routes, setRoutes] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [step, setStep] = useState('search'); // search | results | seats
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Passenger form state for walk-in customers
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');

  // Load routes on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const data = await getRoutes();
        setRoutes(Array.isArray(data) ? data : data.routes || []);
      } catch (err) {
        console.log('Failed to load routes:', err);
      }
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (!selectedRoute) {
      setRouteStops([]);
      return;
    }
    const fetchStops = async () => {
      try {
        const data = await getRouteStops(selectedRoute);
        setRouteStops(Array.isArray(data) ? data : data.stops || []);
      } catch (err) {
        console.log('Failed to load stops:', err);
      }
    };
    fetchStops();
  }, [selectedRoute]);

  const handleSearch = async (formData) => {
    setLoading(true);
    setError('');
    try {
      const data = await searchServiceRuns({
        boardingStopId: formData.boardingStopId,
        disembarkingStopId: formData.disembarkingStopId,
        travelDate: formData.travelDate,
        passengerCount: 1, // clerks typically book one at a time
      });
      const results = Array.isArray(data) ? data : data.serviceRuns || data.results || [];
      setSearchResults(results);
      setStep('results');
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRun = (runId) => {
    const run = searchResults.find((r) => (r.id || r.service_run_id) === runId);
    setSelectedRun(run);
    // For simplicity, we'll pretend the seats are numbered 1-40
    // In a real app you'd fetch actual seat data from the API
    const mockSeats = [];
    for (let i = 1; i <= 40; i++) {
      mockSeats.push({
        seat_id: i,
        seat_number: `S${i}`,
        status: Math.random() > 0.3 ? 'available' : 'booked', // random for demo
      });
    }
    setAvailableSeats(mockSeats);
    setSelectedSeats([]);
    setStep('seats');
  };

  const toggleSeat = (seatId) => {
    const seat = availableSeats.find((s) => s.seat_id === seatId);
    if (!seat || seat.status === 'booked') return;
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  };

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }
    if (!passengerName.trim()) {
      setError('Please enter passenger name');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await confirmBooking({
        serviceRunId: selectedRun.id || selectedRun.service_run_id,
        boardingStopId: selectedRun.boarding_stop_id || '1',
        disembarkingStopId: selectedRun.disembarking_stop_id || '2',
        seatIds: selectedSeats,
        passengerNames: [passengerName],
        passengerPhone,
        passengerEmail,
      });
      const bookingId = data.booking_id || data.id;
      navigate(`/bookings/${bookingId}`);
    } catch (err) {
      console.log('Booking failed:', err);
      setError('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 className="page-title">New Booking (Clerk)</h2>

      {error && <p className="error-text">{error}</p>}

      {step === 'search' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label htmlFor="route">Select Route</label>
              <select
                id="route"
                className="form-control"
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
              >
                <option value="">-- Choose a Route --</option>
                {routes.map((route) => (
                  <option key={route.id || route.route_id} value={route.id || route.route_id}>
                    {route.route_name || route.name || `Route #${route.id || route.route_id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {routeStops.length > 0 && <SearchForm onSubmit={handleSearch} stops={routeStops} />}
        </div>
      )}

      {step === 'results' && (
        <div>
          <button className="btn btn-secondary mb-1" onClick={() => setStep('search')}>
            &larr; New Search
          </button>
          {searchResults.length === 0 ? (
            <div className="card text-center"><p>No service runs found.</p></div>
          ) : (
            searchResults.map((run) => (
              <ServiceRunCard
                key={run.id || run.service_run_id}
                serviceRun={run}
                onSelect={handleSelectRun}
              />
            ))
          )}
        </div>
      )}

      {step === 'seats' && selectedRun && (
        <div>
          <button className="btn btn-secondary mb-1" onClick={() => setStep('results')}>
            &larr; Back to Results
          </button>

          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>{selectedRun.service_name || 'Service'} - Seat Selection</h3>
            <p>Select seat(s) for the passenger</p>
          </div>

          <div className="card">
            <div className="seat-grid">
              {availableSeats.map((seat) => (
                <div
                  key={seat.seat_id}
                  className={`seat ${seat.status === 'booked' ? 'booked' : selectedSeats.includes(seat.seat_id) ? 'selected' : 'available'}`}
                  onClick={() => toggleSeat(seat.seat_id)}
                >
                  {seat.seat_number}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <h3>Passenger Information</h3>
            <div className="form-group">
              <label htmlFor="pName">Passenger Name *</label>
              <input
                type="text"
                id="pName"
                className="form-control"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="pPhone">Phone Number</label>
              <input
                type="tel"
                id="pPhone"
                className="form-control"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="form-group">
              <label htmlFor="pEmail">Email</label>
              <input
                type="email"
                id="pEmail"
                className="form-control"
                value={passengerEmail}
                onChange={(e) => setPassengerEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button
              className="btn btn-primary"
              onClick={handleConfirmBooking}
              disabled={loading || selectedSeats.length === 0}
            >
              {loading ? 'Booking...' : 'Create Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClerkNewBookingPage;
