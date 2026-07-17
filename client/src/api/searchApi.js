import httpClient from './httpClient';

// search for available trips based on from stop, to stop, and date
// this calls the backend search endpoint which queries the database
export const searchServiceRuns = (params) => {
  // console.log('searching with params:', params); // for debugging
  return httpClient.get('/search/service-runs', {
    params: {
      boardingStopId: params.boardingStopId,
      disembarkingStopId: params.disembarkingStopId,
      travelDate: params.travelDate,
      passengerCount: params.passengerCount,
    },
  }).then(res => res.data);
};

// get which seats are free/occupied for a service run between two stops
// TODO: this endpoint might be slow with lots of data, maybe add caching?
export const getSeatAvailability = async (serviceRunId, boardingStopId, disembarkingStopId) => {
  const res = await httpClient.get(`/search/service-runs/${serviceRunId}/seats`, {
    params: {
      boardingStopId,
      disembarkingStopId,
    },
  });
  return res.data;
};
