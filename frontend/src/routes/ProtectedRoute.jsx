import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Props:
 *   allowedRoles: string[] — list of roles permitted to view this route
 *   children: JSX.Element — the page to render if access is granted
 *
 * Logic:
 *   1. Not authenticated → redirect to /login
 *   2. Authenticated but wrong role → redirect to /not-authorized
 *   3. Authenticated + correct role → render children
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
