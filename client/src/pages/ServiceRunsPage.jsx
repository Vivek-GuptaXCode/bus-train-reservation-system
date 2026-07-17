import React, { useState, useEffect } from 'react';
import { getServiceRuns, createServiceRun, updateServiceRun } from '../api/operationsApi';

// Operations page for managing service runs (actual trips on specific dates)
// A service run ties a service to a specific date, departure time, and driver
const ServiceRunsPage = () => {
  const [serviceRuns, setServiceRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRun, setEditingRun] = useState(null);

  const [formData, setFormData] = useState({
    service_id: '',
    run_date: '',
    departure_time: '',
    arrival_time: '',
    status: 'Scheduled',
    driver_name: '',
    notes: '',
  });

  useEffect(() => {
    fetchServiceRuns();
  }, []);

  const fetchServiceRuns = async () => {
    setLoading(true);
    try {
      const data = await getServiceRuns();
      setServiceRuns(Array.isArray(data) ? data : data.serviceRuns || []);
    } catch (err) {
      setError('Failed to load service runs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Combine run_date and departure_time for the backend
      await createServiceRun({
        ...formData,
        departure_time: `${formData.run_date}T${formData.departure_time}:00`,
        arrival_time: `${formData.run_date}T${formData.arrival_time}:00`,
      });
      setFormData({ service_id: '', run_date: '', departure_time: '', arrival_time: '', status: 'Scheduled', driver_name: '', notes: '' });
      setShowForm(false);
      fetchServiceRuns();
    } catch (err) {
      setError('Failed to create service run');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateServiceRun(editingRun.id || editingRun.service_run_id, {
        ...formData,
        departure_time: `${formData.run_date}T${formData.departure_time}:00`,
        arrival_time: `${formData.run_date}T${formData.arrival_time}:00`,
      });
      setEditingRun(null);
      setShowForm(false);
      fetchServiceRuns();
    } catch (err) {
      setError('Failed to update service run');
    }
  };

  if (loading) {
    return <div className="loading">Loading service runs...</div>;
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">Service Runs Management</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingRun(null); setFormData({ service_id: '', run_date: '', departure_time: '', arrival_time: '', status: 'Scheduled', driver_name: '', notes: '' }); }}>
          {showForm ? 'Cancel' : 'Add Service Run'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <div className="card">
          <h3>{editingRun ? 'Edit Service Run' : 'New Service Run'}</h3>
          <form onSubmit={editingRun ? handleUpdate : handleCreate}>
            <div className="form-group">
              <label>Service ID</label>
              <input type="text" name="service_id" className="form-control" value={formData.service_id} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Run Date</label>
              <input type="date" name="run_date" className="form-control" value={formData.run_date} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Departure Time</label>
              <input type="time" name="departure_time" className="form-control" value={formData.departure_time} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Arrival Time</label>
              <input type="time" name="arrival_time" className="form-control" value={formData.arrival_time} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleInputChange}>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Driver Name</label>
              <input type="text" name="driver_name" className="form-control" value={formData.driver_name} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" className="form-control" value={formData.notes} onChange={handleInputChange} rows="3" />
            </div>
            <button type="submit" className="btn btn-primary">
              {editingRun ? 'Update' : 'Create'}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        {serviceRuns.length === 0 ? (
          <p className="text-center">No service runs found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Service</th>
                <th>Date</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Status</th>
                <th>Driver</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {serviceRuns.map((run) => (
                <tr key={run.id || run.service_run_id}>
                  <td>{run.id || run.service_run_id}</td>
                  <td>{run.service_name || run.service_id || 'N/A'}</td>
                  <td>{run.run_date ? new Date(run.run_date).toLocaleDateString() : 'N/A'}</td>
                  <td>{run.departure_time ? new Date(run.departure_time).toLocaleTimeString() : 'N/A'}</td>
                  <td>{run.arrival_time ? new Date(run.arrival_time).toLocaleTimeString() : 'N/A'}</td>
                  <td>
                    <span className={run.status === 'Cancelled' ? 'error-text' : run.status === 'Completed' ? 'success-text' : ''}>
                      {run.status}
                    </span>
                  </td>
                  <td>{run.driver_name || 'N/A'}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => {
                      setEditingRun(run);
                      const depDate = run.departure_time ? new Date(run.departure_time) : new Date();
                      const arrDate = run.arrival_time ? new Date(run.arrival_time) : new Date();
                      setFormData({
                        service_id: run.service_id || '',
                        run_date: depDate.toISOString().split('T')[0],
                        departure_time: depDate.toTimeString().slice(0, 5),
                        arrival_time: arrDate.toTimeString().slice(0, 5),
                        status: run.status || 'Scheduled',
                        driver_name: run.driver_name || '',
                        notes: run.notes || '',
                      });
                      setShowForm(true);
                    }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ServiceRunsPage;
