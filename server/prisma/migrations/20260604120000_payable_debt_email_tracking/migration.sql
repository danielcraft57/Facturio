-- AlterTable
ALTER TABLE "PayableDebt" ADD COLUMN "publicToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PayableDebt_publicToken_key" ON "PayableDebt"("publicToken");

-- CreateIndex
CREATE INDEX "PayableDebt_publicToken_idx" ON "PayableDebt"("publicToken");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" TEXT,
    "invoiceId" TEXT,
    "payableDebtId" INTEGER,
    "type" TEXT NOT NULL,
    "providerId" TEXT,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmailEvent_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmailEvent_payableDebtId_fkey" FOREIGN KEY ("payableDebtId") REFERENCES "PayableDebt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmailEvent" ("createdAt", "id", "invoiceId", "meta", "providerId", "quoteId", "type") SELECT "createdAt", "id", "invoiceId", "meta", "providerId", "quoteId", "type" FROM "EmailEvent";
DROP TABLE "EmailEvent";
ALTER TABLE "new_EmailEvent" RENAME TO "EmailEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
