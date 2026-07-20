/**
 * Helper function to parse and validate query parameters 
 * to build Prisma 'where' and 'orderBy' objects for voucher listings.
 * 
 * @param {Object} query - req.query object from Express
 * @returns {Object} { where, orderBy, error }
 */
const buildVoucherQuery = (query) => {
  const {
    voucherNumber,
    employeeName,
    department,
    category,
    status,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  const where = {};
  const errors = [];

  // --- Validations ---
  const validStatuses = ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Invalid status. Allowed values are: ${validStatuses.join(', ')}`);
  }

  const validSortFields = ['voucherDate', 'expenseDate', 'amount', 'status', 'createdAt'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    errors.push(`Invalid sortBy. Allowed values are: ${validSortFields.join(', ')}`);
  }

  let fromDate, toDate;
  if (dateFrom) {
    fromDate = new Date(dateFrom);
    if (isNaN(fromDate.getTime())) errors.push('Invalid dateFrom format');
  }
  if (dateTo) {
    toDate = new Date(dateTo);
    if (isNaN(toDate.getTime())) {
      errors.push('Invalid dateTo format');
    } else {
      // Set the time to the very end of the day (23:59:59.999) so it's fully inclusive
      toDate.setUTCHours(23, 59, 59, 999);
    }
  }

  let minAmt, maxAmt;
  if (amountMin !== undefined) {
    minAmt = parseFloat(amountMin);
    if (isNaN(minAmt)) errors.push('amountMin must be a valid number');
  }
  if (amountMax !== undefined) {
    maxAmt = parseFloat(amountMax);
    if (isNaN(maxAmt)) errors.push('amountMax must be a valid number');
  }

  if (minAmt !== undefined && maxAmt !== undefined && minAmt > maxAmt) {
    errors.push('amountMin cannot exceed amountMax');
  }

  if (errors.length > 0) {
    return { error: errors.join('. ') };
  }

  // --- Build Prisma Where clauses ---
  if (voucherNumber) {
    where.voucherNumber = { contains: voucherNumber, mode: 'insensitive' };
  }
  
  if (employeeName) {
    where.employee = {
      name: { contains: employeeName, mode: 'insensitive' }
    };
  }

  if (department) {
    where.departmentName = { contains: department, mode: 'insensitive' };
  }

  if (category) {
    where.expenseCategory = category; // Exact match
  }

  if (status) {
    where.status = status; // Exact match
  }

  if (fromDate || toDate) {
    where.expenseDate = {};
    if (fromDate) where.expenseDate.gte = fromDate;
    if (toDate) where.expenseDate.lte = toDate;
  }

  if (minAmt !== undefined || maxAmt !== undefined) {
    where.amount = {};
    if (minAmt !== undefined) where.amount.gte = minAmt;
    if (maxAmt !== undefined) where.amount.lte = maxAmt;
  }

  // --- Build OrderBy ---
  const orderBy = {};
  orderBy[sortBy] = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

  return { where, orderBy };
};

module.exports = { buildVoucherQuery };
