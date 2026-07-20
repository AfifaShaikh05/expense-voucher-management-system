const express = require('express');
const {
  getAllVouchers,
  getPendingVouchers,
  getVoucherDetails,
  approveVoucher,
  rejectVoucher,
  getDirectorDashboard
} = require('../controllers/director.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { uploadSignature } = require('../middlewares/upload.middleware');

const router = express.Router();

// All endpoints in this file are restricted to DIRECTORs
router.use(authenticate);
router.use(authorize('DIRECTOR'));

// GET /api/director/dashboard - Director statistics dashboard
router.get('/dashboard', getDirectorDashboard);

// GET /api/director/vouchers/pending - View pending vouchers
// Must be defined before /:id so it doesn't get captured as an ID parameter
router.get('/vouchers/pending', getPendingVouchers);

// GET /api/director/vouchers - View all vouchers
router.get('/vouchers', getAllVouchers);

// GET /api/director/vouchers/:id - View single voucher details
router.get('/vouchers/:id', getVoucherDetails);

// PATCH /api/director/vouchers/:id/approve - Approve a voucher
router.patch('/vouchers/:id/approve', uploadSignature, approveVoucher);

// PATCH /api/director/vouchers/:id/reject - Reject a voucher
router.patch('/vouchers/:id/reject', rejectVoucher);

module.exports = router;
