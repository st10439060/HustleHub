const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Signs a JWT containing the user id and role.
 * @param {{ id: string, role: string }} user
 * @returns {string} signed JWT
 */
function signToken(user) {
  return jwt.sign({ sub: user.id || user._id.toString(), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

module.exports = { signToken };
