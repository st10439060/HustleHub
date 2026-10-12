const logger = require('../utils/logger');

/**
 * Central error handler. Catches errors passed via `next(err)` and sends
 * a safe JSON response that never exposes stack traces, file paths, or
 * internal configuration.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;

  if (status >= 500) {
    logger.error(`Server error: ${err.message}`);
  } else {
    logger.warn(`Client error (${status}): ${err.message}`);
  }

  if (process.env.NODE_ENV === 'development' && status >= 500) {
    logger.debug(err.stack);
  }

  const response = {
    success: false,
    error: status >= 500 ? 'An internal server error occurred. Please try again later.' : err.message,
  };

  res.status(status).json(response);
}

/**
 * 404 handler for unmatched routes.
 */
function notFound(req, res) {
  res.status(404).json({ success: false, error: 'The requested resource was not found.' });
}

module.exports = { errorHandler, notFound };
