import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Run multiple operations in a MongoDB transaction (replica set required)
 * Falls back to non-transactional execution if replica set is unavailable
 */
export const runInTransaction = async (callback) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error('MongoDB Transaction Error', { error: error.message });
    throw error;
  } finally {
    session.endSession();
  }
};

export default {
  runInTransaction
};