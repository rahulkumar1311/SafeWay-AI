import dotenv from 'dotenv';

// Load .env file
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/safeway_ai',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  aiDrowsinessServiceUrl:
    process.env.AI_DROWSINESS_SERVICE_URL || 'http://localhost:8000/predict/drowsiness',
  aiTrafficSignServiceUrl:
    process.env.AI_TRAFFIC_SIGN_SERVICE_URL || 'http://localhost:8001/predict/traffic-sign',
  aiServiceTimeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 5000
};
