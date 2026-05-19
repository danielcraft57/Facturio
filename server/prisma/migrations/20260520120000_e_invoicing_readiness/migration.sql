-- Réforme facturation électronique 2026 — fondations
ALTER TABLE "Client" ADD COLUMN "siren" TEXT;

ALTER TABLE "Invoice" ADD COLUMN "eInvoiceStatus" TEXT NOT NULL DEFAULT 'NOT_READY';
ALTER TABLE "Invoice" ADD COLUMN "eInvoiceGeneratedAt" DATETIME;
ALTER TABLE "Invoice" ADD COLUMN "eInvoiceXmlHash" TEXT;
