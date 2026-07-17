import httpClient from './httpClient';

/**
 * Search for available service runs matching the criteria
 */
export const searchServiceRuns = async (params) => {
  const response = await httpClient.get('/search/service-runs', {
    params: {
      boardingStopId: params.boardingStopId,
      disembarkingStopId: params.disembarkingStopId,
      travelDate: params.travelDate,
      passengerCount: params.passengerCount,
    },
  });
  return response.data;
};

/**
 * Get seat availability for a specific service run between two stops
 */
export const getSeatAvailability = async (serviceRunId, boardingStopId, disembarkingStopId) => {
  const response = await httpClient.get(`/search/service-runs/${serviceRunId}/seats`, {
    params: {
      boardingStopId,
      disembarkingStopId,
    },
  });
  return response.data;
};
