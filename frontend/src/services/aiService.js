import apiClient from './api';

/**
 * AI Service Client for Drowsiness Detection and Traffic Sign Recognition
 */

/**
 * Send frame to AI backend for drowsiness analysis
 * @param {string} sessionId - Active session UUID/string
 * @param {string} frameData - JPEG base64 data URL
 */
export const analyzeDrowsiness = async (sessionId, frameData) => {
  return apiClient.post('/ai/drowsiness/analyze', {
    sessionId,
    frameData
  });
};

/**
 * Send image to AI backend for traffic sign recognition
 * @param {string} imageData - JPEG/PNG base64 data URL
 */
export const analyzeTrafficSign = async (imageData) => {
  return apiClient.post('/ai/traffic-sign/analyze', {
    imageData
  });
};

export default {
  analyzeDrowsiness,
  analyzeTrafficSign
};
