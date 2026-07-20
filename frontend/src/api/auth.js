import axiosInstance from './axios';

/**
 * Auth API calls — register and login
 */

export const login = (credentials) =>
  axiosInstance.post('/auth/login', credentials);

export const register = (userData) =>
  axiosInstance.post('/auth/register', userData);
