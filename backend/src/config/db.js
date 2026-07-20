const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client singleton instance.
 * We append connection_limit=2 to the DATABASE_URL to prevent EMAXCONNSESSION
 * errors on Supabase's session-mode pooler during rapid nodemon restarts.
 */
const dbUrl = process.env.DATABASE_URL;
const options = {};

if (dbUrl) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  options.datasources = {
    db: {
      url: `${dbUrl}${separator}connection_limit=2`
    }
  };
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(options);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(options);
  }
  prisma = global.prisma;
}

module.exports = prisma;
