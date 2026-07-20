const prisma = require('../config/db');
const generateVoucherNumber = require('../utils/generateVoucherNumber');

/**
 * Helper to validate voucher input data
 */
const validateVoucherInput = (data) => {
  const { departmentName, expenseTitle, expenseCategory, expenseDate, amount } = data;
  
  if (!departmentName) return 'Department Name is required';
  if (!expenseTitle) return 'Expense Title is required';
  if (!expenseCategory) return 'Expense Category is required';
  if (!expenseDate) return 'Expense Date is required';
  
  if (amount === undefined || amount === null) return 'Amount is required';
  if (typeof amount !== 'number' || amount <= 0) return 'Amount must be greater than 0';

  return null;
};

/**
 * Create a new voucher
 * POST /api/vouchers
 */
const createVoucher = async (req, res, next) => {
  try {
    const errorMsg = validateVoucherInput(req.body);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    const { departmentName, expenseTitle, expenseCategory, expenseDescription, expenseDate, amount, employeeSignature } = req.body;
    
    // Auto-generate voucher number
    const voucherNumber = await generateVoucherNumber();

    // Create the voucher as DRAFT
    const newVoucher = await prisma.voucher.create({
      data: {
        voucherNumber,
        departmentName,
        expenseTitle,
        expenseCategory,
        expenseDescription,
        expenseDate: new Date(expenseDate),
        amount,
        employeeSignature,
        employeeId: req.user.userId,
        status: 'DRAFT', // Explicitly DRAFT regardless of body payload
      }
    });

    return res.status(201).json({
      message: 'Voucher created successfully',
      voucher: newVoucher
    });
  } catch (error) {
    next(error); // Pass to centralized error handler
  }
};

/**
 * Upload employee signature for a voucher
 * POST /api/vouchers/:id/signature
 */
const uploadEmployeeSignature = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'Signature file is required' });
    }

    const existingVoucher = await prisma.voucher.findUnique({
      where: { id }
    });

    if (!existingVoucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (existingVoucher.employeeId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied: can only upload signature for your own voucher' });
    }

    if (existingVoucher.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Signature can only be uploaded while voucher is DRAFT' });
    }

    const updatedVoucher = await prisma.voucher.update({
      where: { id },
      data: {
        employeeSignature: req.file.filename // Save the generated filename from Multer
      }
    });

    return res.status(200).json({
      message: 'Signature uploaded successfully',
      voucher: updatedVoucher
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete employee signature for a voucher
 * DELETE /api/vouchers/:id/signature
 */
const deleteEmployeeSignature = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingVoucher = await prisma.voucher.findUnique({
      where: { id }
    });

    if (!existingVoucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (existingVoucher.employeeId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied: can only delete signature for your own voucher' });
    }

    if (existingVoucher.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Signature can only be deleted while voucher is DRAFT' });
    }

    if (existingVoucher.employeeSignature) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../uploads/signatures', existingVoucher.employeeSignature);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const updatedVoucher = await prisma.voucher.update({
      where: { id },
      data: {
        employeeSignature: null
      }
    });

    return res.status(200).json({
      message: 'Signature deleted successfully',
      voucher: updatedVoucher
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Edit a voucher
 * PUT /api/vouchers/:id
 */
const updateVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const existingVoucher = await prisma.voucher.findUnique({
      where: { id }
    });

    if (!existingVoucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    // Enforce ownership and status DRAFT
    if (existingVoucher.employeeId !== req.user.userId || existingVoucher.status !== 'DRAFT') {
      return res.status(403).json({ message: 'Access denied: can only edit your own DRAFT vouchers' });
    }

    // Merge existing data with incoming request to validate the final expected state
    const mergedData = { ...existingVoucher, ...req.body };
    const errorMsg = validateVoucherInput(mergedData);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    const { departmentName, expenseTitle, expenseCategory, expenseDescription, expenseDate, amount, employeeSignature } = req.body;

    const updatedVoucher = await prisma.voucher.update({
      where: { id },
      data: {
        ...(departmentName && { departmentName }),
        ...(expenseTitle && { expenseTitle }),
        ...(expenseCategory && { expenseCategory }),
        ...(expenseDescription !== undefined && { expenseDescription }),
        ...(expenseDate && { expenseDate: new Date(expenseDate) }),
        ...(amount !== undefined && { amount }),
        ...(employeeSignature !== undefined && { employeeSignature }),
      }
    });

    return res.status(200).json({
      message: 'Voucher updated successfully',
      voucher: updatedVoucher
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete a voucher
 * DELETE /api/vouchers/:id
 */
const deleteVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingVoucher = await prisma.voucher.findUnique({
      where: { id }
    });

    if (!existingVoucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    // Enforce ownership and status DRAFT
    if (existingVoucher.employeeId !== req.user.userId || existingVoucher.status !== 'DRAFT') {
      return res.status(403).json({ message: 'Access denied: can only delete your own DRAFT vouchers' });
    }

    await prisma.voucher.delete({
      where: { id }
    });

    return res.status(200).json({
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a voucher (transition from DRAFT to PENDING_APPROVAL)
 * PATCH /api/vouchers/:id/submit
 */
const submitVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingVoucher = await prisma.voucher.findUnique({
      where: { id }
    });

    if (!existingVoucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    // Must belong to logged-in user
    if (existingVoucher.employeeId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied: not your voucher' });
    }

    // Must be DRAFT
    if (existingVoucher.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT vouchers can be submitted' });
    }

    // Employee signature is mandatory before submission
    if (!existingVoucher.employeeSignature) {
      return res.status(400).json({ message: 'Employee signature is required for submission' });
    }

    const updatedVoucher = await prisma.voucher.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL'
      }
    });

    return res.status(200).json({
      message: 'Voucher submitted successfully',
      voucher: updatedVoucher
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List vouchers created by logged-in employee (with pagination)
 * GET /api/vouchers/my
 */
const getMyVouchers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where: { employeeId: req.user.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.voucher.count({
        where: { employeeId: req.user.userId }
      })
    ]);

    return res.status(200).json({
      vouchers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single voucher details
 * GET /api/vouchers/:id
 */
const getVoucherDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const voucher = await prisma.voucher.findUnique({
      where: { id }
    });

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    // Return 403 if it exists but belongs to another user
    if (voucher.employeeId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied: this voucher does not belong to you' });
    }

    return res.status(200).json({ voucher });
  } catch (error) {
    next(error);
  }
};

/**
 * Employee Dashboard Statistics
 * GET /api/vouchers/dashboard
 */
const getEmployeeDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [
      totalVouchers,
      draftVouchers,
      pendingApproval,
      approvedVouchers,
      rejectedVouchers,
      amountAggregate
    ] = await Promise.all([
      prisma.voucher.count({ where: { employeeId: userId } }),
      prisma.voucher.count({ where: { employeeId: userId, status: 'DRAFT' } }),
      prisma.voucher.count({ where: { employeeId: userId, status: 'PENDING_APPROVAL' } }),
      prisma.voucher.count({ where: { employeeId: userId, status: 'APPROVED' } }),
      prisma.voucher.count({ where: { employeeId: userId, status: 'REJECTED' } }),
      prisma.voucher.aggregate({
        where: { employeeId: userId },
        _sum: { amount: true }
      })
    ]);

    return res.status(200).json({
      totalVouchers,
      draftVouchers,
      pendingApproval,
      approvedVouchers,
      rejectedVouchers,
      totalAmountClaimed: amountAggregate._sum.amount || 0
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVoucher,
  updateVoucher,
  deleteVoucher,
  submitVoucher,
  getMyVouchers,
  getVoucherDetails,
  uploadEmployeeSignature,
  deleteEmployeeSignature,
  getEmployeeDashboard
};
