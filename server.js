import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import app from './app.js';
import logger from './app/utils/logger.js';
import connectDB from './app/config/dbConfig.js';

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });
};

startServer();

// Graceful shutdown helper
const handleGracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down server...', { error: err.message, stack: err.stack });
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down server...', { error: err.message, stack: err.stack });
  process.exit(1);
});
