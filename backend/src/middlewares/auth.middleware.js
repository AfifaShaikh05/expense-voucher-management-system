const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to authenticate a user via JWT.
 * Expects a Bearer token in the Authorization header.
 */
const authenticate = (req, res, next) => {
  try {
    // Read the Authorization header
    const authHeader = req.headers.authorization;

    // Check if the header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Extract the token (everything after "Bearer ")
    const token = authHeader.split(' ')[1];

    // Verify the token using our utility function
    const decoded = verifyToken(token);

    // Attach the decoded payload to req.user
    // Now subsequent route handlers and middlewares can access req.user.userId and req.user.role
    req.user = decoded;

    // Call the next middleware or route handler in the chain
    next();
  } catch (error) {
    // Catch errors from verifyToken (e.g., token expired, invalid signature)
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
