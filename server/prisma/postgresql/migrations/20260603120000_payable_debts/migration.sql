-- CreateEnum
CREATE TYPE "PayableDebtStatus" AS ENUM ('OPEN', 'PARTIAL', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "PayableCreditor" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayableCreditor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayableDebt" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "creditorId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "dueDate" TIMESTAMP(3),
    "status" "PayableDebtStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayableDebt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayableDebtPayment" (
    "id" SERIAL NOT NULL,
    "debtId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayableDebtPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PayableCreditor_organizationId_idx" ON "PayableCreditor"("organizationId");
CREATE INDEX "PayableDebt_organizationId_idx" ON "PayableDebt"("organizationId");
CREATE INDEX "PayableDebt_creditorId_idx" ON "PayableDebt"("creditorId");
CREATE INDEX "PayableDebt_status_idx" ON "PayableDebt"("status");
CREATE INDEX "PayableDebtPayment_debtId_idx" ON "PayableDebtPayment"("debtId");

ALTER TABLE "PayableCreditor" ADD CONSTRAINT "PayableCreditor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayableDebt" ADD CONSTRAINT "PayableDebt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayableDebt" ADD CONSTRAINT "PayableDebt_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "PayableCreditor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayableDebtPayment" ADD CONSTRAINT "PayableDebtPayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "PayableDebt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
