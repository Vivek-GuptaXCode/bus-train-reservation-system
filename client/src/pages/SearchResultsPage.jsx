import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchServiceRuns } from '../api/searchApi';
import ServiceRunCard from '../components/search/ServiceRunCard';

// Shows search results - the list of service runs that match the search
const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get the search params from URL
  const boardingStopId = searchParams.get('boardingStopId');
  const disembarkingStopId = searchParams.get('disembarkingStopId');
  const travelDate = searchParams.get('travelDate');
  const passengerCount = searchParams.get('passengerCount');

  useEffect(() => {
    const fetchResults = async () => {
      if (!boardingStopId || !disembarkingStopId || !travelDate) {
        setError('Missing search parameters. Please go back and search again.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await searchServiceRuns({
          boardingStopId,
          disembarkingStopId,
          travelDate,
          passengerCount: parseInt(passengerCount, 10) || 1,
        });
        setResults(Array.isArray(data) ? data : data.serviceRuns || data.results || []);
      } catch (err) {
        console.log('Search error:', err);
        setError(err.response?.data?.message || 'Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [boardingStopId, disembarkingStopId, travelDate, passengerCount]);

  const handleSelect = (serviceRunId) => {
    // Navigate to seat selection, passing the needed info
    navigate(`/service-runs/${serviceRunId}/seats?boardingStopId=${boardingStopId}&disembarkingStopId=${disembarkingStopId}&passengerCount=${passengerCount}`);
  };

  if (loading) {
    return <div className="loading">Searching for available services...</div>;
  }

  if (error) {
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <p className="error-text">{error}</p>
        <button className="btn btn-secondary mt-1" onClick={() => navigate('/search')}>
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <h2 className="page-title">Search Results</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Showing services for {travelDate} | {passengerCount} passenger(s)
      </p>

      {results.length === 0 ? (
        <div className="card text-center">
          <p>No service runs found matching your criteria.</p>
          <p style={{ color: '#666' }}>Try a different date or route.</p>
          <button className="btn btn-secondary mt-1" onClick={() => navigate('/search')}>
            New Search
          </button>
        </div>
      ) : (
        results.map((run) => (
          <ServiceRunCard
            key={run.id || run.service_run_id || run.run_id}
            serviceRun={run}
            onSelect={handleSelect}
          />
        ))
      )}
    </div>
  );
};

export default SearchResultsPage;
