import React, { useState, useEffect } from 'react';
import {
  getServiceRuns,
  createServiceRun,
  updateServiceRun,
  getServices,
  getTransports,
} from '../api/operationsApi';

// service runs are date-wise instances of a service
// Each run links a service with a transport on a specific date/time
const ServiceRunsPage = () => {
  const [serviceRuns, setServiceRuns] = useState([]);
  const [services, setServices] = useState([]);
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRun, setEditingRun] = useState(null);

  const [formData, setFormData] = useState({
    run_id: '',
    service_id: '',
    transport_id: '',
    departure_time: '',
    arrival_time: '',
    status: 'Open',
  });

  useEffect(() => {
    fetchData();
  }, []);

  // load service runs, services, and transports all at once
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [runsData, svcData, transportData] = await Promise.all([
        getServiceRuns(),
        getServices(),
        getTransports(),
      ]);
      setServiceRuns(Array.isArray(runsData) ? runsData : runsData.serviceRuns || []);
      setServices(Array.isArray(svcData) ? svcData : svcData.services || []);
      setTransports(Array.isArray(transportData) ? transportData : transportData.transports || []);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // create a new service run
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        run_id: formData.run_id,
        service_id: formData.service_id,
        transport_id: formData.transport_id,
        departure_time: formData.departure_time,
        arrival_time: formData.arrival_time,
        status: formData.status,
      };
      await createServiceRun(payload);
      setSuccessMsg('Service run created successfully!');
      setFormData({
        run_id: '',
        service_id: '',
        transport_id: '',
        departure_time: '',
        arrival_time: '',
        status: 'Open',
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to create service run.');
      console.log(err);
    }
  };

  // update an existing service run
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const id = editingRun.id || editingRun.service_run_id;
      await updateServiceRun(id, {
        run_id: formData.run_id,
        service_id: formData.service_id,
        transport_id: formData.transport_id,
        departure_time: formData.departure_time,
        arrival_time: formData.arrival_time,
        status: formData.status,
      });
      setSuccessMsg('Service run updated successfully!');
      setEditingRun(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to update service run.');
      console.log(err);
    }
  };

  // open edit form with existing run data
  const startEdit = (run) => {
    setEditingRun(run);
    // format datetime values for the datetime-local input
    const formatForInput = (dateStr) => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        // remove seconds and timezone: YYYY-MM-DDTHH:MM
        return d.toISOString().slice(0, 16);
      } catch {
        return dateStr;
      }
    };
    setFormData({
      run_id: run.run_id || '',
      service_id: run.service_id || '',
      transport_id: run.transport_id || '',
      departure_time: formatForInput(run.departure_time),
      arrival_time: formatForInput(run.arrival_time),
      status: run.status || 'Open',
    });
    setShowForm(true);
    setError('');
    setSuccessMsg('');
  };

  // helper: get service name by id
  const getServiceName = (serviceId) => {
    if (!serviceId) return 'N/A';
    const svc = services.find((s) => (s.id || s.service_id) == serviceId);
    return svc ? svc.service_name || svc.name : `Service #${serviceId}`;
  };

  // helper: get transport number by id
  const getTransportNumber = (transportId) => {
    if (!transportId) return 'N/A';
    const t = transports.find((tr) => (tr.id || tr.transport_id) == transportId);
    return t ? t.transport_number : `Transport #${transportId}`;
  };

  // helper: get badge style for status
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Open':
        return { color: '#2e7d32', background: '#e8f5e9', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 };
      case 'Closed':
        return { color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 };
      case 'Cancelled':
        return { color: '#6a1b9a', background: '#f3e5f5', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 };
      default:
        return { color: '#555', background: '#eee', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 };
    }
  };

  if (loading) {
    return <div className="loading">Loading service runs...</div>;
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="page-title">Manage Service Runs</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditingRun(null);
            setFormData({
              run_id: '',
              service_id: '',
              transport_id: '',
              departure_time: '',
              arrival_time: '',
              status: 'Open',
            });
            setError('');
            setSuccessMsg('');
          }}
        >
          {showForm ? 'Cancel' : 'Add Service Run'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {successMsg && <p className="success-text">{successMsg}</p>}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card">
          <h3>{editingRun ? 'Edit Service Run' : 'New Service Run'}</h3>
          <form onSubmit={editingRun ? handleUpdate : handleCreate}>
            <div className="form-group">
              <label>Run ID</label>
              <input
                type="text"
                name="run_id"
                className="form-control"
                value={formData.run_id}
                onChange={handleInputChange}
                placeholder="e.g. RUN-001"
                required
              />
            </div>
            <div className="form-group">
              <label>Service</label>
              <select
                name="service_id"
                className="form-control"
                value={formData.service_id}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select Service --</option>
                {services.map((s) => (
                  <option key={s.id || s.service_id} value={s.id || s.service_id}>
                    {s.service_name || s.name || `Service ${s.id || s.service_id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Transport</label>
              <select
                name="transport_id"
                className="form-control"
                value={formData.transport_id}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select Transport --</option>
                {transports.map((t) => (
                  <option key={t.id || t.transport_id} value={t.id || t.transport_id}>
                    {t.transport_number || `Transport ${t.id || t.transport_id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Departure Time</label>
              <input
                type="datetime-local"
                name="departure_time"
                className="form-control"
                value={formData.departure_time}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Arrival Time</label>
              <input
                type="datetime-local"
                name="arrival_time"
                className="form-control"
                value={formData.arrival_time}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              {editingRun ? 'Update Service Run' : 'Create Service Run'}
            </button>
          </form>
        </div>
      )}

      {/* Service Runs Table */}
      <div style={{ marginTop: '20px' }}>
        {serviceRuns.length === 0 ? (
          <p>No service runs found. Create one to schedule a trip!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Run ID</th>
                <th>Service Name</th>
                <th>Transport Number</th>
                <th>Departure Time</th>
                <th>Arrival Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {serviceRuns.map((run) => {
                const rid = run.id || run.service_run_id;
                return (
                  <tr key={rid}>
                    <td>{rid}</td>
                    <td>{run.run_id || 'N/A'}</td>
                    <td>{run.service_name || getServiceName(run.service_id)}</td>
                    <td>{run.transport_number || getTransportNumber(run.transport_id)}</td>
                    <td>
                      {run.departure_time
                        ? new Date(run.departure_time).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td>
                      {run.arrival_time
                        ? new Date(run.arrival_time).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td>
                      <span style={getStatusStyle(run.status)}>
                        {run.status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => startEdit(run)}
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

export default ServiceRunsPage;
