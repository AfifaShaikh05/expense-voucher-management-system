const express = require('express');
const {
  createVoucher,
  updateVoucher,
  deleteVoucher,
  submitVoucher,
  getMyVouchers,
  getVoucherDetails,
  uploadEmployeeSignature,
  deleteEmployeeSignature,
  getEmployeeDashboard
} = require('../controllers/voucher.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { uploadSignature } = require('../middlewares/upload.middleware');

const router = express.Router();

// All endpoints in this file are protected and restricted to EMPLOYEEs
router.use(authenticate);
router.use(authorize('EMPLOYEE'));

// Note: /my must come before /:id so Express doesn't treat 'my' as an ID parameter

// GET /api/vouchers/my - List my vouchers (paginated)
router.get('/my', getMyVouchers);

// POST /api/vouchers - Create a new voucher
router.post('/', createVoucher);

// POST /api/vouchers/:id/signature - Upload employee signature
router.post('/:id/signature', uploadSignature, uploadEmployeeSignature);

// DELETE /api/vouchers/:id/signature - Delete employee signature
router.delete('/:id/signature', deleteEmployeeSignature);

// GET /api/vouchers/dashboard - Get employee dashboard statistics
router.get('/dashboard', getEmployeeDashboard);

// GET /api/vouchers/:id - Get a specific voucher
router.get('/:id', getVoucherDetails);

// PUT /api/vouchers/:id - Edit a voucher
router.put('/:id', updateVoucher);

// DELETE /api/vouchers/:id - Delete a voucher
router.delete('/:id', deleteVoucher);

// PATCH /api/vouchers/:id/submit - Submit a DRAFT voucher
router.patch('/:id/submit', submitVoucher);

module.exports = router;
