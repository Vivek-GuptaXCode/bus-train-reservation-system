import React, { useState, useEffect } from 'react';
import { getRoutes, createRoute, updateRoute, getRouteStops, createRouteStop, deleteRouteStop } from '../api/operationsApi';

// Operations page for managing routes and their stops
const RoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  // For adding/editing stops
  const [selectedRouteForStops, setSelectedRouteForStops] = useState(null);
  const [routeStops, setRouteStops] = useState([]);

  // Form state for route
  const [formData, setFormData] = useState({
    route_name: '',
    origin: '',
    destination: '',
  });

  // Form state for stop
  const [stopForm, setStopForm] = useState({
    stop_name: '',
    sequence_number: 1,
    distance_from_origin: 0,
    arrival_time_offset: '00:00',
    departure_time_offset: '00:00',
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const data = await getRoutes();
      setRoutes(Array.isArray(data) ? data : data.routes || []);
    } catch (err) {
      setError('Failed to load routes');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStops = async (routeId) => {
    try {
      const data = await getRouteStops(routeId);
      setRouteStops(Array.isArray(data) ? data : data.stops || []);
    } catch (err) {
      console.log('Failed to load stops:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStopInputChange = (e) => {
    const { name, value } = e.target;
    setStopForm((prev) => ({ ...prev, [name]: name === 'sequence_number' || name === 'distance_from_origin' ? parseInt(value, 10) || 0 : value }));
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await createRoute(formData);
      setFormData({ route_name: '', origin: '', destination: '' });
      setShowForm(false);
      fetchRoutes();
    } catch (err) {
      setError('Failed to create route: ' + (err.response?.data?.message || ''));
    }
  };

  const handleUpdateRoute = async (e) => {
    e.preventDefault();
    try {
      await updateRoute(editingRoute.id || editingRoute.route_id, formData);
      setFormData({ route_name: '', origin: '', destination: '' });
      setEditingRoute(null);
      setShowForm(false);
      fetchRoutes();
    } catch (err) {
      setError('Failed to update route');
    }
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    if (!selectedRouteForStops) return;
    try {
      await createRouteStop(selectedRouteForStops, stopForm);
      setStopForm({ stop_name: '', sequence_number: 1, distance_from_origin: 0, arrival_time_offset: '00:00', departure_time_offset: '00:00' });
      fetchStops(selectedRouteForStops);
    } catch (err) {
      setError('Failed to add stop');
    }
  };

  const handleDeleteStop = async (stopId) => {
    if (!window.confirm('Delete this stop?')) return;
    try {
      await deleteRouteStop(selectedRouteForStops, stopId);
      fetchStops(selectedRouteForStops);
    } catch (err) {
      setError('Failed to delete stop');
    }
  };

  const openEditRoute = (route) => {
    setEditingRoute(route);
    setFormData({
      route_name: route.route_name || route.name || '',
      origin: route.origin || '',
      destination: route.destination || '',
    });
    setShowForm(true);
  };

  const openStopsView = (routeId) => {
    setSelectedRouteForStops(routeId);
    fetchStops(routeId);
  };

  if (loading) {
    return <div className="loading">Loading routes...</div>;
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">Routes Management</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingRoute(null); setFormData({ route_name: '', origin: '', destination: '' }); }}>
          {showForm ? 'Cancel' : 'Add Route'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {/* Route Form */}
      {showForm && (
        <div className="card">
          <h3>{editingRoute ? 'Edit Route' : 'New Route'}</h3>
          <form onSubmit={editingRoute ? handleUpdateRoute : handleCreateRoute}>
            <div className="form-group">
              <label>Route Name</label>
              <input type="text" name="route_name" className="form-control" value={formData.route_name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Origin</label>
              <input type="text" name="origin" className="form-control" value={formData.origin} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <input type="text" name="destination" className="form-control" value={formData.destination} onChange={handleInputChange} required />
            </div>
            <button type="submit" className="btn btn-primary">
              {editingRoute ? 'Update' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {/* Routes Table */}
      <div style={{ marginTop: '20px' }}>
        {routes.length === 0 ? (
          <p className="text-center">No routes found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id || route.route_id}>
                  <td>{route.id || route.route_id}</td>
                  <td>{route.route_name || route.name}</td>
                  <td>{route.origin || 'N/A'}</td>
                  <td>{route.destination || 'N/A'}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }} onClick={() => openEditRoute(route)}>
                      Edit
                    </button>
                    <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => openStopsView(route.id || route.route_id)}>
                      Stops
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stops Section */}
      {selectedRouteForStops && (
        <div className="card" style={{ marginTop: '30px' }}>
          <h3>
            Stops for Route #{selectedRouteForStops}
            <button className="btn btn-secondary" style={{ float: 'right', padding: '5px 10px', fontSize: '12px' }} onClick={() => setSelectedRouteForStops(null)}>
              Close
            </button>
          </h3>

          {/* Add Stop Form */}
          <div style={{ marginTop: '15px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
            <h4>Add Stop</h4>
            <form onSubmit={handleAddStop} className="flex-row" style={{ alignItems: 'end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Stop Name</label>
                <input type="text" name="stop_name" className="form-control" value={stopForm.stop_name} onChange={handleStopInputChange} required />
              </div>
              <div className="form-group">
                <label>Sequence</label>
                <input type="number" name="sequence_number" className="form-control" value={stopForm.sequence_number} onChange={handleStopInputChange} min="1" style={{ width: '80px' }} />
              </div>
              <div className="form-group">
                <label>Distance (km)</label>
                <input type="number" name="distance_from_origin" className="form-control" value={stopForm.distance_from_origin} onChange={handleStopInputChange} style={{ width: '100px' }} />
              </div>
              <div className="form-group">
                <label>Arrival Offset</label>
                <input type="text" name="arrival_time_offset" className="form-control" value={stopForm.arrival_time_offset} onChange={handleStopInputChange} style={{ width: '100px' }} />
              </div>
              <div className="form-group">
                <label>Departure Offset</label>
                <input type="text" name="departure_time_offset" className="form-control" value={stopForm.departure_time_offset} onChange={handleStopInputChange} style={{ width: '100px' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: 'fit-content' }}>Add</button>
            </form>
          </div>

          {/* Stops table */}
          <table style={{ marginTop: '15px' }}>
            <thead>
              <tr>
                <th>Seq</th>
                <th>Stop Name</th>
                <th>Distance</th>
                <th>Arrival</th>
                <th>Departure</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {routeStops.map((stop) => (
                <tr key={stop.id || stop.stop_id}>
                  <td>{stop.sequence_number}</td>
                  <td>{stop.stop_name || stop.name}</td>
                  <td>{stop.distance_from_origin} km</td>
                  <td>{stop.arrival_time_offset}</td>
                  <td>{stop.departure_time_offset}</td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleDeleteStop(stop.id || stop.stop_id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RoutesPage;
