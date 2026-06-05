-- AlterTable
ALTER TABLE "PayableDebt" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "PayableDebt" ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PayableDebt" ADD COLUMN "important" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PayableDebt" ADD COLUMN "snoozedUntil" TIMESTAMP(3);
ALTER TABLE "PayableDebt" ADD COLUMN "seenAt" TIMESTAMP(3);
ALTER TABLE "PayableDebt" ADD COLUMN "sentAt" TIMESTAMP(3);
ALTER TABLE "PayableDebt" ADD COLUMN "tags" TEXT;

-- CreateIndex
CREATE INDEX "PayableDebt_archivedAt_idx" ON "PayableDebt"("archivedAt");
CREATE INDEX "PayableDebt_starred_idx" ON "PayableDebt"("starred");
CREATE INDEX "PayableDebt_important_idx" ON "PayableDebt"("important");
CREATE INDEX "PayableDebt_seenAt_idx" ON "PayableDebt"("seenAt");
CREATE INDEX "PayableDebt_sentAt_idx" ON "PayableDebt"("sentAt");
CREATE INDEX "PayableDebt_organizationId_archivedAt_createdAt_idx" ON "PayableDebt"("organizationId", "archivedAt", "createdAt");
