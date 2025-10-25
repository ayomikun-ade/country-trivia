/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    error: 'Internal server error'
  };

  // Handle specific error types
  if (err.statusCode) {
    statusCode = err.statusCode;
    errorResponse.error = err.message;

    if (err.details) {
      errorResponse.details = err.details;
    }
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error = 'Validation failed';
    errorResponse.details = err.details || {};
  } else if (err.message && err.message.includes('Could not fetch data from')) {
    statusCode = 503;
    errorResponse.error = 'External data source unavailable';
    errorResponse.details = err.message;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found'
  });
}

/**
 * Create a custom error
 */
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError
};
