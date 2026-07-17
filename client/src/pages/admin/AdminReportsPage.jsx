// TODO: connect to report API endpoints
import React, { useState } from 'react';

function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('occupancy');

  // date range state for all report tabs
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const tabs = [
    { key: 'occupancy', label: 'Occupancy' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'cancellations', label: 'Cancellations' },
    { key: 'refunds', label: 'Refunds' },
  ];

  // FIXME: these should come from the actual report API
  const dummyOccupancyData = [
    { route: 'Mumbai - Pune', service: 'Express Bus', date: '2026-07-15', booked: 35, total: 40, occupancy: '87.5%' },
    { route: 'Delhi - Agra', service: 'Shatabdi Express', date: '2026-07-15', booked: 28, total: 50, occupancy: '56.0%' },
    { route: 'Bangalore - Mysore', service: 'Intercity Bus', date: '2026-07-14', booked: 38, total: 40, occupancy: '95.0%' },
  ];

  const dummyRevenueData = [
    { route: 'Mumbai - Pune', date: '2026-07-15', totalRevenue: 17500, ticketsSold: 35, avgFare: 500 },
    { route: 'Delhi - Agra', date: '2026-07-15', totalRevenue: 22400, ticketsSold: 28, avgFare: 800 },
    { route: 'Bangalore - Mysore', date: '2026-07-14', totalRevenue: 19000, ticketsSold: 38, avgFare: 500 },
  ];

  const dummyCancellationData = [
    { bookingId: 101, passenger: 'John Doe', route: 'Mumbai - Pune', date: '2026-07-14', reason: 'Change of plans' },
    { bookingId: 102, passenger: 'Jane Smith', route: 'Delhi - Agra', date: '2026-07-13', reason: 'Medical emergency' },
    { bookingId: 103, passenger: 'Bob Lee', route: 'Bangalore - Mysore', date: '2026-07-12', reason: 'Travel cancelled' },
  ];

  const dummyRefundData = [
    { refundId: 1, bookingId: 101, passenger: 'John Doe', amount: 400, status: 'processed', date: '2026-07-15' },
    { refundId: 2, bookingId: 102, passenger: 'Jane Smith', amount: 640, status: 'pending', date: '2026-07-14' },
    { refundId: 3, bookingId: 103, passenger: 'Bob Lee', amount: 500, status: 'approved', date: '2026-07-13' },
  ];

  const renderOccupancyTab = () => (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>Occupancy Report</h3>
        {/* date range filter */}
        <div className="flex-row mb-2" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Start Date</label>
            <input type="date" className="form-control"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>End Date</label>
            <input type="date" className="form-control"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
          </div>
          <div className="form-group">
            <button className="btn btn-primary">Generate Report</button>
          </div>
        </div>

        <p style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>
          * This is placeholder data. TODO: Connect to actual report API.
        </p>

        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>Service</th>
              <th>Date</th>
              <th>Booked Seats</th>
              <th>Total Seats</th>
              <th>Occupancy %</th>
            </tr>
          </thead>
          <tbody>
            {dummyOccupancyData.map((row, i) => (
              <tr key={i}>
                <td>{row.route}</td>
                <td>{row.service}</td>
                <td>{row.date}</td>
                <td>{row.booked}</td>
                <td>{row.total}</td>
                <td>
                  <span style={{ 
                    color: parseFloat(row.occupancy) > 80 ? '#28a745' : 
                           parseFloat(row.occupancy) > 50 ? '#ffc107' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {row.occupancy}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRevenueTab = () => (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>Revenue Report</h3>
        <div className="flex-row mb-2" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Start Date</label>
            <input type="date" className="form-control"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>End Date</label>
            <input type="date" className="form-control"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
          </div>
          <div className="form-group">
            <button className="btn btn-primary">Generate Report</button>
          </div>
        </div>

        <p style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>
          * Placeholder data - connect to revenue report API.
        </p>

        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>Date</th>
              <th>Total Revenue</th>
              <th>Tickets Sold</th>
              <th>Avg Fare</th>
            </tr>
          </thead>
          <tbody>
            {dummyRevenueData.map((row, i) => (
              <tr key={i}>
                <td>{row.route}</td>
                <td>{row.date}</td>
                <td>₹{row.totalRevenue.toLocaleString()}</td>
                <td>{row.ticketsSold}</td>
                <td>₹{row.avgFare}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2" style={{ textAlign: 'right' }}>
          <strong>Total Revenue:</strong>{' '}
          <span style={{ fontSize: '18px', color: '#28a745', fontWeight: 'bold' }}>
            ₹{dummyRevenueData.reduce((sum, r) => sum + r.totalRevenue, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  const renderCancellationsTab = () => (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>Cancellation Report</h3>
        <div className="flex-row mb-2" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Start Date</label>
            <input type="date" className="form-control"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>End Date</label>
            <input type="date" className="form-control"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
          </div>
          <div className="form-group">
            <button className="btn btn-primary">Generate Report</button>
          </div>
        </div>

        <p style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>
          * Placeholder data - connect to cancellation report API.
        </p>

        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Passenger</th>
              <th>Route</th>
              <th>Date</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {dummyCancellationData.map((row, i) => (
              <tr key={i}>
                <td>{row.bookingId}</td>
                <td>{row.passenger}</td>
                <td>{row.route}</td>
                <td>{row.date}</td>
                <td>{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-1">
          <strong>Total Cancellations:</strong> {dummyCancellationData.length}
        </p>
      </div>
    </div>
  );

  const renderRefundsTab = () => (
    <div>
      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>Refund Report</h3>
        <div className="flex-row mb-2" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Start Date</label>
            <input type="date" className="form-control"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>End Date</label>
            <input type="date" className="form-control"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
          </div>
          <div className="form-group">
            <button className="btn btn-primary">Generate Report</button>
          </div>
        </div>

        <p style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>
          * Placeholder data - connect to refund report API.
        </p>

        <table>
          <thead>
            <tr>
              <th>Refund ID</th>
              <th>Booking ID</th>
              <th>Passenger</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {dummyRefundData.map((row, i) => (
              <tr key={i}>
                <td>{row.refundId}</td>
                <td>{row.bookingId}</td>
                <td>{row.passenger}</td>
                <td>₹{row.amount.toLocaleString()}</td>
                <td>
                  <span style={{
                    color: row.status === 'processed' ? '#28a745' : 
                           row.status === 'approved' ? '#17a2b8' : '#ffc107',
                    fontWeight: 'bold'
                  }}>
                    {row.status.toUpperCase()}
                  </span>
                </td>
                <td>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2" style={{ textAlign: 'right' }}>
          <strong>Total Refunded:</strong>{' '}
          <span style={{ fontSize: '18px', color: '#dc3545', fontWeight: 'bold' }}>
            ₹{dummyRefundData
              .filter(r => r.status === 'processed')
              .reduce((sum, r) => sum + r.amount, 0)
              .toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ marginTop: '30px' }}>
      <h2 className="page-title">Admin Reports</h2>

      {/* tabs */}
      <div className="flex-row mb-2" style={{ borderBottom: '2px solid #ddd' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #007bff' : '3px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              color: activeTab === tab.key ? '#007bff' : '#666',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* tab content */}
      <div>
        {activeTab === 'occupancy' && renderOccupancyTab()}
        {activeTab === 'revenue' && renderRevenueTab()}
        {activeTab === 'cancellations' && renderCancellationsTab()}
        {activeTab === 'refunds' && renderRefundsTab()}
      </div>
    </div>
  );
}

export default AdminReportsPage;
