import apiClient from './api';

/**
 * Road Hazard Tracking & Spatial GeoJSON Service Client
 */

/**
 * Report a new road hazard
 */
export const createHazard = async (hazardData) => {
  return apiClient.post('/hazards', hazardData);
};

/**
 * Fetch paginated road hazards list with optional status, type, severity filters
 */
export const getHazards = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  return apiClient.get(`/hazards?${queryParams.toString()}`);
};

/**
 * Fetch nearby hazards within a radius (in km) using 2dsphere GeoJSON index
 */
export const getNearbyHazards = async (latitude, longitude, radius = 10) => {
  const queryParams = new URLSearchParams({ latitude, longitude, radius });
  return apiClient.get(`/hazards/nearby?${queryParams.toString()}`);
};

/**
 * Update hazard status (e.g. resolve)
 */
export const updateHazardStatus = async (hazardId, status = 'resolved') => {
  return apiClient.patch(`/hazards/${hazardId}`, { status });
};

export default {
  createHazard,
  getHazards,
  getNearbyHazards,
  updateHazardStatus
};
