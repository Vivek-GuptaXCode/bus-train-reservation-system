import React from 'react';

/**
 * SearchForm - lets user pick boarding stop, destination stop, date, and passenger count
 * This is a simple form - the actual stop data comes from the parent component
 */
function SearchForm({ 
  stops, 
  boardingStopId, 
  setBoardingStopId, 
  disembarkingStopId, 
  setDisembarkingStopId,
  travelDate, 
  setTravelDate, 
  passengerCount, 
  setPassengerCount, 
  onSubmit,
  disabledStops 
}) {
  // filter destination stops to only show stops after the selected boarding stop
  // based on the stop sequence
  const getDestinationStops = () => {
    if (!boardingStopId || !stops || stops.length === 0) return stops;

    const selectedStop = stops.find(s => s.route_stop_id === parseInt(boardingStopId));
    if (!selectedStop) return stops;

    // only show stops with a higher sequence number
    return stops.filter(s => s.sequence_number > selectedStop.sequence_number);
  };

  const destinationStops = getDestinationStops();

  return (
    <div className="card">
      <div className="flex-row">
        {/* boarding stop dropdown */}
        <div className="form-group" style={{ flex: 1 }}>
          <label>From (Boarding Stop)</label>
          <select
            className="form-control"
            value={boardingStopId}
            onChange={(e) => {
              setBoardingStopId(e.target.value);
              // reset destination when boarding changes
              setDisembarkingStopId('');
            }}
          >
            <option value="">-- Select Boarding Stop --</option>
            {stops && stops.map((stop) => (
              <option key={stop.route_stop_id} value={stop.route_stop_id}>
                {stop.stop_name} (Stop #{stop.sequence_number})
              </option>
            ))}
          </select>
        </div>

        {/* destination stop dropdown */}
        <div className="form-group" style={{ flex: 1 }}>
          <label>To (Destination Stop)</label>
          <select
            className="form-control"
            value={disembarkingStopId}
            onChange={(e) => setDisembarkingStopId(e.target.value)}
            disabled={!boardingStopId}
          >
            <option value="">-- Select Destination --</option>
            {destinationStops.map((stop) => (
              <option key={stop.route_stop_id} value={stop.route_stop_id}>
                {stop.stop_name} (Stop #{stop.sequence_number})
              </option>
            ))}
          </select>
        </div>

        {/* travel date */}
        <div className="form-group" style={{ flex: 1 }}>
          <label>Travel Date</label>
          <input
            type="date"
            className="form-control"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* passenger count */}
        <div className="form-group" style={{ flex: 0.5 }}>
          <label>Passengers</label>
          <input
            type="number"
            className="form-control"
            value={passengerCount}
            onChange={(e) => setPassengerCount(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="6"
          />
        </div>

        {/* search button */}
        <div className="form-group" style={{ flex: 0.3, alignSelf: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onSubmit} style={{ width: '100%' }}>
            Search
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchForm;
