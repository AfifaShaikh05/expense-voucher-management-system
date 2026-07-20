import axiosInstance from './axios';

/**
 * Director API calls
 */

export const getAllVouchers = (params) =>
  axiosInstance.get('/director/vouchers', { params });

export const getPendingVouchers = (params) =>
  axiosInstance.get('/director/vouchers/pending', { params });

export const getVoucherById = (id) =>
  axiosInstance.get(`/director/vouchers/${id}`);

export const approveVoucher = (id, formData) =>
  axiosInstance.patch(`/director/vouchers/${id}/approve`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const rejectVoucher = (id, data) =>
  axiosInstance.patch(`/director/vouchers/${id}/reject`, data);

export const getDirectorDashboard = () =>
  axiosInstance.get('/director/dashboard');
