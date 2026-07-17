import React, { useState } from 'react';

// Reports Dashboard for admins
// Shows occupancy, revenue, cancellations, and refunds reports
// TODO: connect to report API endpoints when available
const ReportsPage = () => {
  // tab state: 'occupancy' | 'revenue' | 'cancellations' | 'refunds'
  const [activeTab, setActiveTab] = useState('occupancy');

  // date range filters for generating reports
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // each tab has its own generate state
  const [generated, setGenerated] = useState({
    occupancy: false,
    revenue: false,
    cancellations: false,
    refunds: false,
  });

  // switch between tabs
  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  // simulate generating a report
  const handleGenerate = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    setGenerated((prev) => ({ ...prev, [activeTab]: true }));
  };

  // tab button style helper
  const tabBtnStyle = (tab) => ({
    padding: '10px 20px',
    border: 'none',
    cursor: 'pointer',
    background: activeTab === tab ? '#1a237e' : '#e0e0e0',
    color: activeTab === tab ? 'white' : '#333',
    borderRadius: '4px',
    marginRight: '8px',
    fontWeight: activeTab === tab ? 600 : 400,
  });

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h2 className="page-title">Reports Dashboard</h2>

      {/* Tab Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        <button style={tabBtnStyle('occupancy')} onClick={() => switchTab('occupancy')}>
          Occupancy
        </button>
        <button style={tabBtnStyle('revenue')} onClick={() => switchTab('revenue')}>
          Revenue
        </button>
        <button style={tabBtnStyle('cancellations')} onClick={() => switchTab('cancellations')}>
          Cancellations
        </button>
        <button style={tabBtnStyle('refunds')} onClick={() => switchTab('refunds')}>
          Refunds
        </button>
      </div>

      {/* Date Range Filter (shared across tabs) */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Date Range Filter</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '180px' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '180px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} style={{ height: 'fit-content' }}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="card">
        {/* Occupancy Report Tab */}
        {activeTab === 'occupancy' && (
          <div>
            <h3 style={{ marginBottom: '15px' }}>Occupancy Report</h3>
            {generated.occupancy ? (
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Service</th>
                    <th>Run ID</th>
                    <th>Date</th>
                    <th>Capacity</th>
                    <th>Booked</th>
                    <th>Occupancy %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      Report data will appear here.
                      {/* TODO: connect to report API endpoints for occupancy data */}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#666' }}>
                Select a date range and click "Generate Report" to view occupancy data.
              </p>
            )}
          </div>
        )}

        {/* Revenue Report Tab */}
        {activeTab === 'revenue' && (
          <div>
            <h3 style={{ marginBottom: '15px' }}>Revenue Report</h3>
            {generated.revenue ? (
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Date</th>
                    <th>Received Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      Report data will appear here.
                      {/* TODO: connect to report API endpoints for revenue data */}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#666' }}>
                Select a date range and click "Generate Report" to view revenue data.
              </p>
            )}
          </div>
        )}

        {/* Cancellations Report Tab */}
        {activeTab === 'cancellations' && (
          <div>
            <h3 style={{ marginBottom: '15px' }}>Cancellations Report</h3>
            {generated.cancellations ? (
              <table>
                <thead>
                  <tr>
                    <th>Cancellation ID</th>
                    <th>Date</th>
                    <th>Reason</th>
                    <th>Ticket ID</th>
                    <th>Booking ID</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      Report data will appear here.
                      {/* TODO: connect to report API endpoints for cancellations data */}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#666' }}>
                Select a date range and click "Generate Report" to view cancellation data.
              </p>
            )}
          </div>
        )}

        {/* Refunds Report Tab */}
        {activeTab === 'refunds' && (
          <div>
            <h3 style={{ marginBottom: '15px' }}>Refunds Report</h3>
            {generated.refunds ? (
              <table>
                <thead>
                  <tr>
                    <th>Refund ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      Report data will appear here.
                      {/* TODO: connect to report API endpoints for refunds data */}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#666' }}>
                Select a date range and click "Generate Report" to view refund data.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
