const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token for a given payload.
 * @param {Object} payload - Data to encode in the token (e.g., { userId, role })
 * @returns {string} - The signed JWT
 */
const generateToken = (payload) => {
  // Uses JWT_SECRET from .env, falls back to a default if not found (not recommended for production)
  const secret = process.env.JWT_SECRET || 'fallback_secret_please_change';
  
  // Sign the token to expire in 7 days
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

/**
 * Verifies and decodes a JSON Web Token.
 * @param {string} token - The JWT string to verify
 * @returns {Object} - The decoded payload if valid
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_please_change';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken
};
