const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Express middleware that verifies the JWT sent in the Authorization header.
 * On success it attaches `req.user = { id, role }`.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (!header || scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Provide a valid Bearer token.',
    });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token has expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid authentication token.' });
    }
    logger.warn('Unexpected JWT verification error:', err.message);
    return res.status(401).json({ success: false, error: 'Authentication failed.' });
  }
}

/**
 * Higher-order middleware: restricts access to the given role(s).
 * Must be used AFTER `authenticate`.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
