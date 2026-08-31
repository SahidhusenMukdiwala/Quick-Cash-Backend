import mysql from 'mysql2';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config({ debug: false });

export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quickcash_ledger',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  timezone: 'Z'
});

db.getConnection((err, connection) => {
  try {
    if (err) {
      logger.error('MySQL connection error', { error: err.message });
    } else {
      logger.info('MySQL database connected successfully');
      connection.release();
    }
  } catch (error) {
    logger.error('Exception during DB connection test', { error: error.message, stack: error.stack });
  }
});