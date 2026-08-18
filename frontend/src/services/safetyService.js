import apiClient from './api';

/**
 * Safety Risk Analysis Service Client
 */

/**
 * Submit driving telemetry data to backend for official safety scoring
 * @param {Object} telemetryData
 * @param {string} telemetryData.userId
 * @param {number} telemetryData.speed
 * @param {number} telemetryData.speedLimit
 * @param {number} telemetryData.drowsinessScore
 * @param {number} telemetryData.harshBrakingCount
 * @param {boolean} telemetryData.nearbyHazard
 */
export const analyzeSafety = async (telemetryData) => {
  return apiClient.post('/safety/analyze', telemetryData);
};

export default {
  analyzeSafety
};
