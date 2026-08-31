/**
 * Standardized API Response helper function for success responses
 */
export class ApiResponse {
  constructor(statusCode, data = null, message = 'Success') {
    this.success = true;
    this.errors = [];
    this.result = {
      message,
      ...(data !== null && { data })
    };
  }
}

export const apiResponse = (statusCode, data = null, message = 'Success') => {
  return {
    success: true,
    errors: [],
    result: {
      message,
      ...(data !== null && { data })
    }
  };
};

export default apiResponse;
