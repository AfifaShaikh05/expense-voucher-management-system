const prisma = require('../config/db');
const { buildVoucherQuery } = require('../utils/voucherFilters');
const { getSignedSignatureUrl } = require('../utils/signatureStorage');

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
 * View ALL vouchers org-wide (Read-only)
 * GET /api/accounts/vouchers
 * Query params: ?page=1&limit=10&status=APPROVED
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

    // Explicitly exclude DRAFT vouchers for Accounts
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
            select: { name: true, email: true, employeeId: true }
          },
          director: {
            select: { name: true, email: true }
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
 * View full details of any voucher (Read-only)
 * GET /api/accounts/vouchers/:id
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
          select: { name: true, email: true }
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
 * Accounts Dashboard Statistics
 * GET /api/accounts/dashboard
 */
const getAccountsDashboard = async (req, res, next) => {
  try {
    const [
      totalVouchers,
      pendingApproval,
      approvedVouchers,
      rejectedVouchers,
      approvedAmountAggregate,
      recentApproved
    ] = await Promise.all([
      prisma.voucher.count({ where: { status: { not: 'DRAFT' } } }),
      prisma.voucher.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.voucher.count({ where: { status: 'APPROVED' } }),
      prisma.voucher.count({ where: { status: 'REJECTED' } }),
      prisma.voucher.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true }
      }),
      prisma.voucher.findMany({
        where: { status: 'APPROVED' },
        take: 5,
        orderBy: { approvalDate: 'desc' },
        select: {
          voucherNumber: true,
          amount: true,
          approvalDate: true,
          employee: {
            select: { name: true }
          }
        }
      })
    ]);

    return res.status(200).json({
      totalVouchers,
      pendingApproval,
      approvedVouchers,
      rejectedVouchers,
      totalApprovedExpenseAmount: approvedAmountAggregate._sum.amount || 0,
      recentApprovedVouchers: recentApproved.map(v => ({
        voucherNumber: v.voucherNumber,
        employeeName: v.employee?.name,
        amount: v.amount,
        approvalDate: v.approvalDate
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVouchers,
  getVoucherDetails,
  getAccountsDashboard
};
