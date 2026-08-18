import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    // Do not terminate process in development if DB connection fails, allowing server to serve non-DB health endpoints
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Warning] Disconnected from database');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB Error] Event error: ${err.message}`);
});
