import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchForm from '../components/search/SearchForm';
import { getRoutes, getRouteStops } from '../api/operationsApi';

// Main search page - user picks origin, destination, date, and passenger count
const SearchPage = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [loading, setLoading] = useState(false);

  // Load all routes when the page mounts
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const data = await getRoutes();
        setRoutes(Array.isArray(data) ? data : data.routes || []);
      } catch (err) {
        console.log('Failed to load routes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  // When a route is selected, fetch its stops
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
        setRouteStops([]);
      }
    };
    fetchStops();
  }, [selectedRoute]);

  // Sometimes all stops are across all routes - merge them
  // For simplicity, user picks a route first, then gets stops for that route
  const handleSearch = (searchFormData) => {
    // Navigate to results page with search params encoded
    const params = new URLSearchParams({
      boardingStopId: searchFormData.boardingStopId,
      disembarkingStopId: searchFormData.disembarkingStopId,
      travelDate: searchFormData.travelDate,
      passengerCount: searchFormData.passengerCount,
    });
    navigate(`/search/results?${params.toString()}`);
  };

  if (loading) {
    return <div className="loading">Loading routes...</div>;
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 className="page-title">Search for a Journey</h2>

      {/* Route selector */}
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

      {routeStops.length > 0 && (
        <SearchForm onSubmit={handleSearch} stops={routeStops} />
      )}

      {selectedRoute && routeStops.length === 0 && (
        <p className="text-center" style={{ color: '#666' }}>
          This route has no stops configured yet.
        </p>
      )}
    </div>
  );
};

export default SearchPage;
