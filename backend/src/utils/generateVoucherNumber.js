const prisma = require('../config/db');

/**
 * Generates a unique, sequential voucher number in the format VCH-YYYY-XXXXXX
 * It looks up the latest voucher created in the current year to determine the next sequence number.
 * 
 * @returns {Promise<string>} The generated voucher number
 */
const generateVoucherNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `VCH-${currentYear}-`;

  // Find the most recently created voucher in the current year
  const lastVoucher = await prisma.voucher.findFirst({
    where: {
      voucherNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc', // Get the latest one
    },
  });

  // If no vouchers exist for this year, start at 000001
  if (!lastVoucher) {
    return `${prefix}000001`;
  }

  // Extract the numeric part of the voucher number
  const lastNumberString = lastVoucher.voucherNumber.replace(prefix, '');
  const lastNumber = parseInt(lastNumberString, 10);
  
  if (isNaN(lastNumber)) {
    // Fallback if parsing fails for some unexpected reason
    return `${prefix}000001`;
  }

  // Increment and pad with leading zeros
  const nextNumber = lastNumber + 1;
  const nextNumberString = nextNumber.toString().padStart(6, '0');

  return `${prefix}${nextNumberString}`;
};

module.exports = generateVoucherNumber;
