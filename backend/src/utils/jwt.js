const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  return secret || 'fallback_secret_please_change';
};

/**
 * Generates a JSON Web Token for a given payload.
 * @param {Object} payload - Data to encode in the token (e.g., { userId, role })
 * @returns {string} - The signed JWT
 */
const generateToken = (payload) => {
  // Sign the token to expire in 7 days
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
};

/**
 * Verifies and decodes a JSON Web Token.
 * @param {string} token - The JWT string to verify
 * @returns {Object} - The decoded payload if valid
 */
const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  generateToken,
  verifyToken
};
