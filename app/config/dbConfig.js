import dns from 'node:dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config({ debug: false });

// Ensure SRV records can resolve reliably on Windows across different ISP DNS servers
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  logger.warn('Could not set custom DNS servers for SRV resolution', { error: err.message });
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quickcash_ledger';
    const conn = await mongoose.connect(mongoUri, {
      dbName: 'quickcash_ledger',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected successfully...`);
    return conn;
  } catch (error) {
    logger.error('MongoDB connection error', { error: error.message });
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

export default connectDB;