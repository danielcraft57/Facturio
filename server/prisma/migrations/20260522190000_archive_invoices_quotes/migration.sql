-- Archivage soft des factures et devis (pas de suppression)
ALTER TABLE "Invoice" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "Quote" ADD COLUMN "archivedAt" DATETIME;
CREATE INDEX "Invoice_archivedAt_idx" ON "Invoice"("archivedAt");
CREATE INDEX "Quote_archivedAt_idx" ON "Quote"("archivedAt");
