import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getHealthStatus = asyncHandler(async (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'disconnected';

  return res.status(200).json({
    success: true,
    message: 'SafeWay-AI backend is running',
    database: dbStatus
  });
});
