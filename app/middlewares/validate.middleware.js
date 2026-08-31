import createError from '../utils/ApiError.js';

/**
 * Zod Request Validation Middleware
 * @param {import('zod').ZodSchema} schema - Zod schema to validate req.body, req.query, or req.params
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    // Replace req parameters with validated and sanitized data
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error.name === 'ZodError' || error.issues || error.errors) {
      const issueList = error.errors || error.issues || [];
      const formattedErrors = Array.isArray(issueList)
        ? issueList.map((err) => ({ message: err.message }))
        : [];
      return next(createError(400, 'Validation Error', formattedErrors));
    }
    next(error);
  }
};

export default validate;
