import apiClient from './api';

/**
 * Defined Traffic Fine Information Service Client
 */

/**
 * Fetch state-wise defined traffic fines with optional category, vehicleType, and pagination
 */
export const getChallansByState = async (state, params = {}) => {
  const queryParams = new URLSearchParams(params);
  return apiClient.get(`/challans/${encodeURIComponent(state)}?${queryParams.toString()}`);
};

export default {
  getChallansByState
};
