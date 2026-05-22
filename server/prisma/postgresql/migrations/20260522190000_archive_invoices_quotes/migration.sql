ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Invoice_archivedAt_idx" ON "Invoice"("archivedAt");
CREATE INDEX IF NOT EXISTS "Quote_archivedAt_idx" ON "Quote"("archivedAt");
