-- CreateTable
CREATE TABLE "PayableCreditor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayableCreditor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PayableDebt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "creditorId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayableDebt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayableDebt_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "PayableCreditor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PayableDebtPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "debtId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayableDebtPayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "PayableDebt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PayableCreditor_organizationId_idx" ON "PayableCreditor"("organizationId");
CREATE INDEX "PayableDebt_organizationId_idx" ON "PayableDebt"("organizationId");
CREATE INDEX "PayableDebt_creditorId_idx" ON "PayableDebt"("creditorId");
CREATE INDEX "PayableDebt_status_idx" ON "PayableDebt"("status");
CREATE INDEX "PayableDebtPayment_debtId_idx" ON "PayableDebtPayment"("debtId");
