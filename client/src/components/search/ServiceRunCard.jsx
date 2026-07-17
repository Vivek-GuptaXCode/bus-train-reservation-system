import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ServiceRunCard - shows info about a single service run in search results
 * Clicking "Select Seats" goes to the seat selection page
 */
function ServiceRunCard({ serviceRun, boardingStopId, disembarkingStopId, passengerCount }) {
  const navigate = useNavigate();

  // make the date look nicer for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  // format time string to HH:MM
  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return timeStr;
    }
  };

  // navigate to seat selection page with query params
  const handleSelect = () => {
    // console.log('user selected run:', serviceRun.service_run_id);
    navigate(
      `/service-runs/${serviceRun.service_run_id}/seats?boardingStopId=${boardingStopId}&disembarkingStopId=${disembarkingStopId}&passengerCount=${passengerCount || 1}`
    );
  };

  // different badge color for bus vs train
  const getBadgeClass = (type) => {
    if (!type) return '';
    return type.toLowerCase() === 'bus' ? 'badge badge-bus' : 'badge badge-train';
  };

  return (
    <div className="card" style={{ borderLeft: '4px solid #007bff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '10px' }}>
            {serviceRun.service_name || 'Service'}
            <span className={getBadgeClass(serviceRun.transport_type)} style={{ marginLeft: '10px' }}>
              {serviceRun.transport_type ? serviceRun.transport_type.toUpperCase() : ''}
            </span>
          </h3>

          {/* transport and route info */}
          <div className="flex-row" style={{ marginBottom: '8px' }}>
            <div>
              <strong>Transport:</strong> {serviceRun.transport_number || 'N/A'} 
              {serviceRun.transport_model ? ` (${serviceRun.transport_model})` : ''}
            </div>
            <div>
              <strong>Route:</strong> {serviceRun.route_name || 'N/A'}
            </div>
          </div>

          {/* date and times */}
          <div className="flex-row" style={{ marginBottom: '8px' }}>
            <div>
              <strong>Date:</strong> {formatDate(serviceRun.departure_time)}
            </div>
            <div>
              <strong>Departure:</strong> {formatTime(serviceRun.departure_time)}
            </div>
            <div>
              <strong>Arrival:</strong> {formatTime(serviceRun.arrival_time)}
            </div>
          </div>

          {/* seat availability - TODO: this sometimes shows wrong count, need to fix */}
          {serviceRun.available_seats !== undefined && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Available Seats:</strong> {serviceRun.available_seats}
              {serviceRun.total_seats !== undefined && ` / ${serviceRun.total_seats}`}
            </div>
          )}

          {/* status badge with color */}
          <div>
            <strong>Status:</strong>{' '}
            <span style={{ 
              color: serviceRun.status === 'scheduled' ? '#28a745' : 
                     serviceRun.status === 'cancelled' ? '#dc3545' : '#ffc107',
              fontWeight: 'bold'
            }}>
              {serviceRun.status || 'Unknown'}
            </span>
          </div>
        </div>

        {/* price and select button */}
        <div style={{ textAlign: 'center', minWidth: '120px' }}>
          {serviceRun.estimated_fare && (
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff', marginBottom: '10px' }}>
              ₹{parseFloat(serviceRun.estimated_fare).toFixed(2)}
            </div>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handleSelect}
            disabled={serviceRun.status === 'cancelled' || (serviceRun.available_seats !== undefined && serviceRun.available_seats <= 0)}
            style={{ width: '100%' }}
          >
            Select Seats
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceRunCard;
