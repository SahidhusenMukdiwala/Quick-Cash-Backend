import { db } from '../config/dbConfig.js';
import logger from './logger.js';

/**
 * Execute a single query with optional parameters
 */
export const executeQuery = ({ query, values = [] }) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) {
        logger.error('MySQL Error In Helper', { query, error: err.message, stack: err.stack });
        return reject(err);
      }
      resolve(result);
    });
  });
};

/**
 * Get a connection from the pool for transaction management
 */
export const getConnection = () => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        logger.error('MySQL Connection Error', { error: err.message });
        return reject(err);
      }
      resolve(connection);
    });
  });
};

/**
 * Execute a query within a specific connection (used for transactions)
 */
export const executeTransactionQuery = (connection, query, values = []) => {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, result) => {
      if (err) {
        logger.error('MySQL Transaction Error', { query, error: err.message });
        return reject(err);
      }
      resolve(result);
    });
  });
};

/**
 * Wrapper for running multiple queries in a single transaction
 * @param {Function} callback - Async function that takes 'connection' and 'execute' as arguments
 */
export const runInTransaction = async (callback) => {
  const connection = await getConnection();
  try {
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => (err ? reject(err) : resolve()));
    });

    // Helper to execute query using this specific transaction connection
    const execute = (query, values) => executeTransactionQuery(connection, query, values);

    const result = await callback(connection, execute);

    await new Promise((resolve, reject) => {
      connection.commit((err) => (err ? reject(err) : resolve()));
    });

    return result;
  } catch (error) {
    await new Promise((resolve) => {
      connection.rollback(() => resolve());
    });
    throw error;
  } finally {
    connection.release();
  }
};