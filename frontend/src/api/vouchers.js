import axiosInstance from './axios';

/**
 * Employee Voucher API calls
 */

export const getMyVouchers = (params) =>
  axiosInstance.get('/vouchers/my', { params });

export const getVoucherById = (id) =>
  axiosInstance.get(`/vouchers/${id}`);

export const createVoucher = (data) =>
  axiosInstance.post('/vouchers', data);

export const updateVoucher = (id, data) =>
  axiosInstance.put(`/vouchers/${id}`, data);

export const deleteVoucher = (id) =>
  axiosInstance.delete(`/vouchers/${id}`);

export const submitVoucher = (id) =>
  axiosInstance.patch(`/vouchers/${id}/submit`);

export const uploadEmployeeSignature = (id, formData) =>
  axiosInstance.post(`/vouchers/${id}/signature`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteEmployeeSignature = (id) =>
  axiosInstance.delete(`/vouchers/${id}/signature`);

export const getEmployeeDashboard = () =>
  axiosInstance.get('/vouchers/dashboard');
