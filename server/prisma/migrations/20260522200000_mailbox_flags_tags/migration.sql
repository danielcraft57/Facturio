-- Flags type Gmail + tags JSON sur factures et devis
ALTER TABLE "Invoice" ADD COLUMN "starred" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "important" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "snoozedUntil" DATETIME;
ALTER TABLE "Invoice" ADD COLUMN "seenAt" DATETIME;
ALTER TABLE "Invoice" ADD COLUMN "tags" TEXT;

ALTER TABLE "Quote" ADD COLUMN "starred" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "important" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "snoozedUntil" DATETIME;
ALTER TABLE "Quote" ADD COLUMN "seenAt" DATETIME;
ALTER TABLE "Quote" ADD COLUMN "tags" TEXT;

CREATE INDEX "Invoice_mailbox_idx" ON "Invoice"("archivedAt", "starred", "important", "status");
CREATE INDEX "Quote_mailbox_idx" ON "Quote"("archivedAt", "starred", "important", "status");
