const prisma = require('../config/db');
const { buildVoucherQuery } = require('../utils/voucherFilters');
const { uploadSignature, getSignedSignatureUrl } = require('../utils/signatureStorage');

const resolveVoucherSignatureUrls = async (voucher) => {
  if (!voucher) return voucher;

  return {
    ...voucher,
    employeeSignature: await getSignedSignatureUrl(voucher.employeeSignature),
    directorSignature: await getSignedSignatureUrl(voucher.directorSignature)
  };
};

const resolveVoucherListSignatureUrls = async (vouchers) => {
  return Promise.all(vouchers.map(resolveVoucherSignatureUrls));
};

/**
 * View ALL vouchers in the system (with basic pagination, filtering, and sorting)
 * GET /api/director/vouchers
 * Query params: ?page=1&limit=10&status=DRAFT&sortBy=createdAt&order=desc
 */
const getAllVouchers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { where, orderBy, error } = buildVoucherQuery(req.query);

    if (error) {
      return res.status(400).json({ message: error });
    }

    // Explicitly exclude DRAFT vouchers for Director
    if (!where.status) {
      where.status = { not: 'DRAFT' };
    } else if (where.status === 'DRAFT') {
      where.status = { not: 'DRAFT' };
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          employee: {
            select: { name: true, email: true, employeeId: true } // Include basic creator details
          }
        }
      }),
      prisma.voucher.count({ where })
    ]);

    const vouchersWithSignedUrls = await resolveVoucherListSignatureUrls(vouchers);

    return res.status(200).json({
      vouchers: vouchersWithSignedUrls,
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
 * View only vouchers in PENDING_APPROVAL status
 * GET /api/director/vouchers/pending
 */
const getPendingVouchers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { status: 'PENDING_APPROVAL' };

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }, // Often it's better to review the oldest pending vouchers first
        include: {
          employee: {
            select: { name: true, email: true, employeeId: true }
          }
        }
      }),
      prisma.voucher.count({ where })
    ]);

    const vouchersWithSignedUrls = await resolveVoucherListSignatureUrls(vouchers);

    return res.status(200).json({
      vouchers: vouchersWithSignedUrls,
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
 * View full details of any voucher
 * GET /api/director/vouchers/:id
 */
const getVoucherDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        employee: {
          select: { name: true, email: true, employeeId: true }
        },
        director: {
          select: { name: true, email: true, employeeId: true }
        }
      }
    });

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    const voucherWithSignedUrls = await resolveVoucherSignatureUrls(voucher);

    return res.status(200).json({ voucher: voucherWithSignedUrls });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a voucher
 * PATCH /api/director/vouchers/:id/approve
 */
const approveVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'Director signature file is required for approval' });
    }

    const existingVoucher = await prisma.voucher.findUnique({
      where: { id }
    });

    if (!existingVoucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (existingVoucher.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ message: 'Only vouchers in PENDING_APPROVAL status can be approved' });
    }

    const directorSignature = await uploadSignature(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      id,
      'director'
    );

    // Critical business rule: explicitly whitelist ONLY the fields the Director is allowed to modify.
    // It is structurally impossible to modify employee-entered fields via this update object.
    const updatedVoucher = await prisma.voucher.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvalDate: new Date(),
        directorId: req.user.userId,
        directorSignature: directorSignature,
        rejectionReason: null // Clear any previous rejection reason just in case
      }
    });

    const voucherWithSignedUrls = await resolveVoucherSignatureUrls(updatedVoucher);

    return res.status(200).json({
      message: 'Voucher approved successfully',
      voucher: voucherWithSignedUrls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a voucher
 * PATCH /api/director/vouchers/:id/reject
 */
const rejectVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const existingVoucher = await prisma.voucher.findUnique({
      where: { id }
    });

    if (!existingVoucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (existingVoucher.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ message: 'Only vouchers in PENDING_APPROVAL status can be rejected' });
    }

    // Critical business rule: explicitly whitelist ONLY the fields the Director is allowed to modify.
    const updatedVoucher = await prisma.voucher.update({
      where: { id },
      data: {
        status: 'REJECTED',
        directorId: req.user.userId,
        rejectionReason: rejectionReason.trim(),
        directorSignature: null, // Ensure no stray approval signature is kept
        approvalDate: null
      }
    });

    const voucherWithSignedUrls = await resolveVoucherSignatureUrls(updatedVoucher);

    return res.status(200).json({
      message: 'Voucher rejected successfully',
      voucher: voucherWithSignedUrls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Director Dashboard Statistics
 * GET /api/director/dashboard
 */
const getDirectorDashboard = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      pendingApprovalCount,
      approvedToday,
      rejectedToday,
      amountAggregate,
      recentActivity
    ] = await Promise.all([
      prisma.voucher.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.voucher.count({ 
        where: { 
          status: 'APPROVED', 
          approvalDate: { gte: startOfToday, lte: endOfToday } 
        } 
      }),
      prisma.voucher.count({ 
        where: { 
          status: 'REJECTED', 
          updatedAt: { gte: startOfToday, lte: endOfToday } 
        } 
      }),
      prisma.voucher.aggregate({
        where: { status: 'PENDING_APPROVAL' },
        _sum: { amount: true }
      }),
      prisma.voucher.findMany({
        where: { status: { not: 'DRAFT' } }, // Exclude draft vouchers
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          voucherNumber: true,
          status: true,
          updatedAt: true,
          employee: {
            select: { name: true }
          }
        }
      })
    ]);

    return res.status(200).json({
      pendingApprovalCount,
      approvedToday,
      rejectedToday,
      totalPendingAmount: amountAggregate._sum.amount || 0,
      recentActivity: recentActivity.map(v => ({
        id: v.id,
        voucherNumber: v.voucherNumber,
        employeeName: v.employee?.name,
        status: v.status,
        updatedAt: v.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVouchers,
  getPendingVouchers,
  getVoucherDetails,
  approveVoucher,
  rejectVoucher,
  getDirectorDashboard
};
