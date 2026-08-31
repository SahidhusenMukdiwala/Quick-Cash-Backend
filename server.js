import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import logger from './app/utils/logger.js';
import './app/config/dbConfig.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down server...', { error: err.message, stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down server...', { error: err.message, stack: err.stack });
  process.exit(1);
});
