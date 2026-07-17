import React, { useState, useEffect } from 'react';
import { getServices, createService, updateService, getRoutes } from '../api/operationsApi';

// services page for managing bus and train services
// Each service defines a route, type, and schedule
const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [formData, setFormData] = useState({
    service_name: '',
    service_type: 'Bus',
    status: 'Active',
    route_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  // load both services and routes (for dropdown)
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [svcData, routeData] = await Promise.all([getServices(), getRoutes()]);
      setServices(Array.isArray(svcData) ? svcData : svcData.services || []);
      setRoutes(Array.isArray(routeData) ? routeData : routeData.routes || []);
    } catch (err) {
      setError('Failed to load data. Check your connection.');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // create a new service
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        service_name: formData.service_name,
        service_type: formData.service_type,
        status: formData.status,
        route_id: formData.route_id,
      };
      await createService(payload);
      setSuccessMsg('Service created successfully!');
      setFormData({ service_name: '', service_type: 'Bus', status: 'Active', route_id: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to create service. Make sure all fields are correct.');
      console.log(err);
    }
  };

  // update an existing service
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const id = editingService.id || editingService.service_id;
      await updateService(id, {
        service_name: formData.service_name,
        service_type: formData.service_type,
        status: formData.status,
        route_id: formData.route_id,
      });
      setSuccessMsg('Service updated successfully!');
      setEditingService(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to update service.');
      console.log(err);
    }
  };

  // open edit form with existing data
  const startEdit = (svc) => {
    setEditingService(svc);
    setFormData({
      service_name: svc.service_name || svc.name || '',
      service_type: svc.service_type || 'Bus',
      status: svc.status || 'Active',
      route_id: svc.route_id || '',
    });
    setShowForm(true);
    setError('');
    setSuccessMsg('');
  };

  // find route name by id for display
  const getRouteName = (routeId) => {
    if (!routeId) return 'N/A';
    const route = routes.find((r) => (r.id || r.route_id) == routeId);
    return route ? route.route_name || route.name : `Route #${routeId}`;
  };

  if (loading) {
    return <div className="loading">Loading services...</div>;
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="page-title">Manage Services</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditingService(null);
            setFormData({ service_name: '', service_type: 'Bus', status: 'Active', route_id: '' });
            setError('');
            setSuccessMsg('');
          }}
        >
          {showForm ? 'Cancel' : 'Add Service'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {successMsg && <p className="success-text">{successMsg}</p>}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card">
          <h3>{editingService ? 'Edit Service' : 'New Service'}</h3>
          <form onSubmit={editingService ? handleUpdate : handleCreate}>
            <div className="form-group">
              <label>Service Name</label>
              <input
                type="text"
                name="service_name"
                className="form-control"
                value={formData.service_name}
                onChange={handleInputChange}
                placeholder="e.g. Mumbai-Pune Express"
                required
              />
            </div>
            <div className="form-group">
              <label>Service Type</label>
              <select
                name="service_type"
                className="form-control"
                value={formData.service_type}
                onChange={handleInputChange}
              >
                <option value="Bus">Bus</option>
                <option value="Train">Train</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <input
                type="text"
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleInputChange}
                placeholder="Active / Inactive"
              />
            </div>
            <div className="form-group">
              <label>Route</label>
              <select
                name="route_id"
                className="form-control"
                value={formData.route_id}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select Route --</option>
                {routes.map((r) => (
                  <option key={r.id || r.route_id} value={r.id || r.route_id}>
                    {r.route_name || r.name || `Route ${r.id || r.route_id}`}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              {editingService ? 'Update Service' : 'Create Service'}
            </button>
          </form>
        </div>
      )}

      {/* Services Table */}
      <div style={{ marginTop: '20px' }}>
        {services.length === 0 ? (
          <p>No services found. Add a service to get started!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Service Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Route Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => {
                const sid = svc.id || svc.service_id;
                return (
                  <tr key={sid}>
                    <td>{sid}</td>
                    <td>{svc.service_name || svc.name}</td>
                    <td>
                      <span className={svc.service_type === 'Train' ? 'badge badge-train' : 'badge badge-bus'}>
                        {svc.service_type}
                      </span>
                    </td>
                    <td>{svc.status || 'N/A'}</td>
                    <td>{svc.route_name || getRouteName(svc.route_id)}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => startEdit(svc)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
