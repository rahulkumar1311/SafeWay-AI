import axios from 'axios';

// Environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Centrally configured Axios instance for SafeWay-AI backend services.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second default timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} -> ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor for uniform error handling
apiClient.interceptors.response.use(
  (response) => {
    // Standard response format from backend is { success: true, data: ... }
    return response.data;
  },
  (error) => {
    let formattedError = {
      status: 500,
      message: 'An unexpected error occurred. Please try again.',
      success: false,
      raw: error
    };

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      formattedError = {
        status: 504,
        message: 'Request timed out. The service may be taking too long to respond.',
        success: false,
        isTimeout: true
      };
    } else if (error.response) {
      // Server responded with error status code (4xx, 5xx)
      const status = error.response.status;
      const data = error.response.data;

      let message = data?.message || error.message;

      if (status === 503) {
        message = data?.message || 'AI service or backend service is currently unavailable.';
      } else if (status === 504) {
        message = data?.message || 'AI service request timed out.';
      } else if (status === 429) {
        message = 'Too many requests. Please slow down and try again later.';
      } else if (status === 404) {
        message = data?.message || 'Requested resource not found.';
      } else if (status === 400) {
        message = data?.message || 'Bad request. Please check input data.';
      }

      formattedError = {
        status,
        message,
        success: false,
        data: data?.data || null
      };
    } else if (error.request) {
      // Network error - no response received from backend
      formattedError = {
        status: 503,
        message: 'Cannot connect to SafeWay-AI backend server. Is server running on port 5000?',
        success: false,
        isNetworkError: true
      };
    }

    if (import.meta.env.DEV) {
      console.error(`[API Error ${formattedError.status}]`, formattedError.message);
    }

    return Promise.reject(formattedError);
  }
);

export default apiClient;
