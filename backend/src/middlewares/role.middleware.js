/**
 * Middleware to authorize specific roles.
 * Must be used AFTER the authenticate middleware.
 * 
 * @param {...string} allowedRoles - A list of roles allowed to access the route
 * @returns {Function} - Express middleware function
 * 
 * Usage example:
 * router.get('/directors-only', authenticate, authorize('DIRECTOR'), controllerFunction)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure req.user exists (set by authenticate middleware)
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    // User is authorized, proceed to the next middleware or route handler
    next();
  };
};

module.exports = { authorize };
