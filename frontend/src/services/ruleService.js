import apiClient from './api';

/**
 * Traffic Rules Directory Service Client
 */

/**
 * Fetch state-wise traffic rules with optional category, vehicleType, and pagination
 */
export const getRulesByState = async (state, params = {}) => {
  const queryParams = new URLSearchParams(params);
  return apiClient.get(`/rules/${encodeURIComponent(state)}?${queryParams.toString()}`);
};

export default {
  getRulesByState
};
