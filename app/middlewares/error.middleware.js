import createError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  const error = createError(404, `Route Not Found - ${req.originalUrl}`);
  next(error);
};

/**
 * Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  let errors = [];
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    errors = err.errors.map((e) => ({
      message: typeof e === 'string' ? e : e.message || String(e)
    }));
  } else if (message) {
    errors = [{ message }];
  }

  const response = {
    success: false,
    errors,
    result: {}
  };

  logger.error(`${req.method} ${req.originalUrl} - ${message}`, {
    statusCode,
    errors
  });

  res.status(statusCode).json(response);
};
