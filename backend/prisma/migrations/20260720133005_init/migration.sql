-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'DIRECTOR', 'ACCOUNTS');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "employeeId" TEXT,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "voucherDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "departmentName" TEXT NOT NULL,
    "expenseTitle" TEXT NOT NULL,
    "expenseCategory" TEXT NOT NULL,
    "expenseDescription" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeSignature" TEXT,
    "status" "VoucherStatus" NOT NULL DEFAULT 'DRAFT',
    "directorId" TEXT,
    "directorSignature" TEXT,
    "approvalDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_voucherNumber_key" ON "Voucher"("voucherNumber");

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
