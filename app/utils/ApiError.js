/**
 * Factory function for operational API errors
 */
export const createError = (statusCode, message, errors = []) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.success = false;
  error.errors = errors;
  return error;
};

export default createError;
