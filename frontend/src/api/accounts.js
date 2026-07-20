import axiosInstance from './axios';

/**
 * Accounts Team API calls (read-only)
 */

export const getAllVouchers = (params) =>
  axiosInstance.get('/accounts/vouchers', { params });

export const getVoucherById = (id) =>
  axiosInstance.get(`/accounts/vouchers/${id}`);

export const getAccountsDashboard = () =>
  axiosInstance.get('/accounts/dashboard');
