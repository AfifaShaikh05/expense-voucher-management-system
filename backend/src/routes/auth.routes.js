const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/test-protected
// Temporary test route to verify that the authenticate and authorize middlewares work correctly.
// It allows any of the specified roles.
router.get(
  '/test-protected',
  authenticate,
  authorize('EMPLOYEE', 'DIRECTOR', 'ACCOUNTS'),
  (req, res) => {
    res.status(200).json({
      message: 'You are authenticated!',
      user: req.user
    });
  }
);

module.exports = router;
