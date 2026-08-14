import app from './src/app.js';
import { config } from './src/config/env.js';
import { connectDB } from './src/config/db.js';

const startServer = async () => {
  try {
    // Attempt MongoDB connection
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`[SafeWay-AI Backend] Server listening on port ${config.port} in ${config.nodeEnv} mode`);
    });

    const handleShutdown = (signal) => {
      console.log(`[Server] ${signal} signal received: closing HTTP server`);
      server.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error(`[Server Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
