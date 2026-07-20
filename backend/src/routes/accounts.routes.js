const express = require('express');
const {
  getAllVouchers,
  getVoucherDetails,
  getAccountsDashboard
} = require('../controllers/accounts.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

// All endpoints in this file are restricted to ACCOUNTS role
// They are strictly read-only by design. No POST/PUT/PATCH/DELETE methods are defined.
router.use(authenticate);
router.use(authorize('ACCOUNTS'));

// GET /api/accounts/dashboard - Accounts statistics dashboard
router.get('/dashboard', getAccountsDashboard);

// GET /api/accounts/vouchers - View all org-wide vouchers
router.get('/vouchers', getAllVouchers);

// GET /api/accounts/vouchers/:id - View single voucher details
router.get('/vouchers/:id', getVoucherDetails);

module.exports = router;
