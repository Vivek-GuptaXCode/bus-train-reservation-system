import React, { useState, useEffect } from 'react';
import {
  getTransports,
  createTransport,
  updateTransport,
  getTransportSeats,
  generateSeats,
} from '../api/operationsApi';
import httpClient from '../api/httpClient';

// show all the transports
// Transport management page - admins can add/edit transports and manage seats
const TransportsPage = () => {
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTransport, setEditingTransport] = useState(null);

  // expanded row for seats
  const [expandedTransportId, setExpandedTransportId] = useState(null);
  const [transportSeats, setTransportSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);

  // add seat form
  const [newSeatNo, setNewSeatNo] = useState('');

  const [formData, setFormData] = useState({
    transport_number: '',
    transport_type: 'Bus',
    capacity: 40,
  });

  useEffect(() => {
    fetchTransports();
  }, []);

  // fetch all transports from the API
  const fetchTransports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTransports();
      setTransports(Array.isArray(data) ? data : data.transports || []);
    } catch (err) {
      setError('Failed to load transports');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // fetch seats for a specific transport
  const fetchSeats = async (transportId) => {
    setSeatsLoading(true);
    try {
      const data = await getTransportSeats(transportId);
      setTransportSeats(Array.isArray(data) ? data : data.seats || []);
    } catch (err) {
      console.log('Failed to load seats:', err);
    } finally {
      setSeatsLoading(false);
    }
  };

  // toggle expanded row to show/hide seats
  const toggleExpand = (transportId) => {
    if (expandedTransportId === transportId) {
      // collapse
      setExpandedTransportId(null);
      setTransportSeats([]);
      setNewSeatNo('');
    } else {
      // expand
      setExpandedTransportId(transportId);
      fetchSeats(transportId);
      setNewSeatNo('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // create a new transport
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
      };
      await createTransport(payload);
      setSuccessMsg('Transport created successfully!');
      setFormData({ transport_number: '', transport_type: 'Bus', capacity: 40 });
      setShowForm(false);
      fetchTransports();
    } catch (err) {
      setError('Failed to create transport');
    }
  };

  // update an existing transport
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const id = editingTransport.id || editingTransport.transport_id;
      await updateTransport(id, {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
      });
      setSuccessMsg('Transport updated successfully!');
      setEditingTransport(null);
      setShowForm(false);
      fetchTransports();
    } catch (err) {
      setError('Failed to update transport');
    }
  };

  // open the edit form with transport data pre-filled
  const startEdit = (transport) => {
    setEditingTransport(transport);
    setFormData({
      transport_number: transport.transport_number || '',
      transport_type: transport.transport_type || 'Bus',
      capacity: transport.capacity || 40,
    });
    setShowForm(true);
    setError('');
    setSuccessMsg('');
  };

  // add a single seat to a transport
  const handleAddSeat = async (e) => {
    e.preventDefault();
    if (!newSeatNo.trim() || !expandedTransportId) return;
    setError('');
    try {
      // addSeat is not in operationsApi, so we call the API directly
      await httpClient.post(`/transports/${expandedTransportId}/seats`, {
        seat_no: newSeatNo.trim(),
      });
      setNewSeatNo('');
      fetchSeats(expandedTransportId);
    } catch (err) {
      setError('Failed to add seat');
      console.log(err);
    }
  };

  // generate seats for a transport (prompt for count)
  const handleGenerateSeats = async () => {
    if (!expandedTransportId) return;
    const countStr = window.prompt('How many seats to generate?', '40');
    if (!countStr) return;
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count <= 0) {
      setError('Please enter a valid number');
      return;
    }
    setError('');
    try {
      // pass count in request body since the base API doesn't take a count param
      await httpClient.post(`/transports/${expandedTransportId}/seats/generate`, {
        totalSeats: count,
      });
      fetchSeats(expandedTransportId);
    } catch (err) {
      setError('Failed to generate seats');
      console.log(err);
    }
  };

  // loading spinner
  if (loading) {
    return <div className="loading">Loading transports...</div>;
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="page-title">Manage Transports</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditingTransport(null);
            setFormData({ transport_number: '', transport_type: 'Bus', capacity: 40 });
            setError('');
            setSuccessMsg('');
          }}
        >
          {showForm ? 'Cancel' : 'Add Transport'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {successMsg && <p className="success-text">{successMsg}</p>}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card">
          <h3>{editingTransport ? 'Edit Transport' : 'New Transport'}</h3>
          <form onSubmit={editingTransport ? handleUpdate : handleCreate}>
            <div className="form-group">
              <label>Transport Number</label>
              <input
                type="text"
                name="transport_number"
                className="form-control"
                value={formData.transport_number}
                onChange={handleInputChange}
                placeholder="e.g. MH-01-AB-1234"
                required
              />
            </div>
            <div className="form-group">
              <label>Transport Type</label>
              <select
                name="transport_type"
                className="form-control"
                value={formData.transport_type}
                onChange={handleInputChange}
              >
                <option value="Bus">Bus</option>
                <option value="Train">Train</option>
              </select>
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                name="capacity"
                className="form-control"
                value={formData.capacity}
                onChange={handleInputChange}
                min="1"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {editingTransport ? 'Update Transport' : 'Create Transport'}
            </button>
          </form>
        </div>
      )}

      {/* Transports Table */}
      <div style={{ marginTop: '20px' }}>
        {transports.length === 0 ? (
          <p>No transports found. Add one to get started!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Transport Number</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transports.map((t) => {
                const tid = t.id || t.transport_id;
                const isExpanded = expandedTransportId === tid;
                return (
                  <React.Fragment key={tid}>
                    {/* main row - click to expand */}
                    <tr
                      style={{ cursor: 'pointer', background: isExpanded ? '#f0f4ff' : '' }}
                      onClick={() => toggleExpand(tid)}
                    >
                      <td>{tid}</td>
                      <td>
                        <span className={t.transport_type === 'Train' ? 'badge badge-train' : 'badge badge-bus'}>
                          {t.transport_type}
                        </span>
                      </td>
                      <td>{t.transport_number}</td>
                      <td>{t.capacity}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(t);
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                    {/* expanded row: seats view */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} style={{ padding: '15px', background: '#fafafa' }}>
                          <div>
                            <h4>Seats for Transport #{tid}</h4>

                            {/* Add Seat Form */}
                            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                              <form
                                onSubmit={handleAddSeat}
                                style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}
                              >
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label>Seat Number</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={newSeatNo}
                                    onChange={(e) => setNewSeatNo(e.target.value)}
                                    placeholder="e.g. A1"
                                    style={{ width: '150px' }}
                                    required
                                  />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ height: 'fit-content' }}>
                                  Add Seat
                                </button>
                              </form>
                            </div>

                            {/* Generate Seats Button */}
                            <div style={{ marginBottom: '15px' }}>
                              <button className="btn btn-primary" onClick={handleGenerateSeats}>
                                Generate Seats
                              </button>
                            </div>

                            {/* Seats Table */}
                            {seatsLoading ? (
                              <div className="loading">Loading seats...</div>
                            ) : transportSeats.length === 0 ? (
                              <p style={{ color: '#666' }}>
                                No seats found. Add a seat manually or generate seats.
                              </p>
                            ) : (
                              <table style={{ width: 'auto', minWidth: '200px' }}>
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Seat No</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {transportSeats.map((seat, idx) => (
                                    <tr key={seat.id || seat.seat_id || idx}>
                                      <td>{idx + 1}</td>
                                      <td>{seat.seat_no || seat.seat_number || 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransportsPage;
