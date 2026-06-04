-- AlterTable
ALTER TABLE "PayableDebt" ADD COLUMN "publicToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PayableDebt_publicToken_key" ON "PayableDebt"("publicToken");

-- CreateIndex
CREATE INDEX "PayableDebt_publicToken_idx" ON "PayableDebt"("publicToken");

-- AlterTable
ALTER TABLE "EmailEvent" ADD COLUMN "payableDebtId" INTEGER;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_payableDebtId_fkey" FOREIGN KEY ("payableDebtId") REFERENCES "PayableDebt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
