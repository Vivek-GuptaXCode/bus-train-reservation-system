import React, { useState } from 'react';

// Simple reports page - TODO: implement actual report data fetching
// For now just shows placeholder report summaries
const ReportsPage = () => {
  const [reportType, setReportType] = useState('');

  const reportOptions = [
    { value: 'bookings', label: 'Booking Report' },
    { value: 'revenue', label: 'Revenue Report' },
    { value: 'occupancy', label: 'Occupancy Report' },
    { value: 'cancellations', label: 'Cancellation Report' },
  ];

  // Mock data for demonstration
  const mockSummary = {
    totalBookings: 245,
    totalRevenue: '₹1,25,430',
    averageOccupancy: '78%',
    cancellations: 12,
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 className="page-title">Reports</h2>

      {/* Quick Stats Cards */}
      <div className="flex-row" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <h3 style={{ color: '#007bff' }}>245</h3>
          <p>Total Bookings</p>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <h3 style={{ color: '#28a745' }}>₹1,25,430</h3>
          <p>Total Revenue</p>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <h3 style={{ color: '#17a2b8' }}>78%</h3>
          <p>Average Occupancy</p>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <h3 style={{ color: '#dc3545' }}>12</h3>
          <p>Cancellations</p>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="card">
        <h3>Generate Report</h3>
        <div className="form-group">
          <label>Report Type</label>
          <select className="form-control" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="">-- Select Report Type --</option>
            {reportOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {reportType && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <p><strong>{reportOptions.find((o) => o.value === reportType)?.label}</strong></p>
            <p style={{ color: '#666' }}>
              This report would fetch data from the backend API and display it here.
              {/* FIXME: implement actual report fetching logic */}
            </p>

            {/* Mock table for demonstration */}
            <table style={{ marginTop: '10px' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2024-01-15</td>
                  <td>Mumbai-Pune Express</td>
                  <td>42</td>
                  <td>₹21,000</td>
                </tr>
                <tr>
                  <td>2024-01-16</td>
                  <td>Delhi-Agra Shatabdi</td>
                  <td>38</td>
                  <td>₹19,500</td>
                </tr>
                <tr>
                  <td>2024-01-17</td>
                  <td>Bangalore-Chennai Mail</td>
                  <td>55</td>
                  <td>₹27,800</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
