import axios from 'axios';

/**
 * Central Axios instance for all API calls.
 * baseURL is read from the Vite environment variable so it never needs
 * to be changed manually between dev / staging / production.
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT token from localStorage to every request
// ---------------------------------------------------------------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — on 401, clear auth data and force re-login.
// Uses window.location.href because this module lives outside React's tree
// and cannot use the navigate() hook.
// ---------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized: clear auth and redirect
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Avoid redirect loop if already on /login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Normalize error message for UI consumption
    // This ensures err.response.data.message always has a friendly string
    if (!error.response) {
      // Network error, timeout, or CORS error where no response was received
      error.response = { data: { message: 'Network error. Please check your connection and try again.' } };
    } else if (error.response.status >= 500) {
      // Server error (500, 502, 503)
      error.response.data = error.response.data || {};
      error.response.data.message = error.response.data.message || 'An unexpected server error occurred. Please try again later.';
    } else if (error.response.status === 404) {
      // 404 Not Found fallback
      error.response.data = error.response.data || {};
      error.response.data.message = error.response.data.message || 'The requested resource was not found. It may have been deleted.';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
