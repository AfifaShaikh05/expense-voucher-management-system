import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/auth';

const AuthContext = createContext(null);

/**
 * Maps a role string to its home dashboard route.
 */
const ROLE_DASHBOARD = {
  EMPLOYEE: '/employee/dashboard',
  DIRECTOR: '/director/dashboard',
  ACCOUNTS: '/accounts/dashboard'
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Initialise from localStorage so a page refresh doesn't log the user out
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Keep localStorage in sync whenever token/user changes
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, user]);

  /**
   * login — calls POST /api/auth/login and stores credentials.
   * Returns the user object so the caller can redirect based on role.
   * Throws on failure so the UI can display the error message.
   */
  const login = useCallback(async (email, password) => {
    // Response shape confirmed from auth.controller.js:
    // { message, token, user: { id, name, email, role } }
    const { data } = await loginApi({ email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user; // caller uses user.role to redirect
  }, []);

  /**
   * logout — wipes state, localStorage, and sends user to /login.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    role: user?.role || null,
    login,
    logout,
    ROLE_DASHBOARD
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook — throws a clear error if used outside <AuthProvider>
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
};

export default AuthContext;
