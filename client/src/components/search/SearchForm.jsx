import React from 'react';

/**
 * SearchForm - lets user pick boarding stop, destination stop, date, and passenger count
 * This form gets the stops list from the parent and sends search params up on submit
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
  // figure out which stops are valid destinations (only stops AFTER the boarding stop)
  const getDestinationStops = () => {
    if (!boardingStopId || !stops || stops.length === 0) return stops;

    const selectedStop = stops.find(s => s.route_stop_id === parseInt(boardingStopId));
    if (!selectedStop) return stops;

    // only show stops with a higher sequence number
    // so you can't accidentally go backwards
    return stops.filter(s => s.sequence_number > selectedStop.sequence_number);
  };

  const destinationStops = getDestinationStops();

  // FIXME: min date doesn't account for timezone differences

  return (
    <div className="card">
      <div className="flex-row">
        {/* boarding stop */}
        <div className="form-group" style={{ flex: 1 }}>
          <label>From (Boarding Stop)</label>
          <select
            className="form-control"
            value={boardingStopId}
            onChange={(e) => {
              setBoardingStopId(e.target.value);
              setDisembarkingStopId(''); // reset dest when boarding changes
              // console.log('selected boarding stop:', e.target.value);
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

        {/* destination stop - disabled until boarding is picked */}
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

        {/* date picker */}
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

        {/* how many passengers? */}
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

        {/* the search button */}
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
