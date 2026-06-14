-- AlterEnum
ALTER TYPE "InvoiceInstallmentStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED' BEFORE 'PENDING';

-- Échéances programmées : seule la première PENDING par facture reste active.
UPDATE "InvoiceInstallment" AS inst
SET "status" = 'SCHEDULED'
WHERE inst."status" = 'PENDING'
  AND inst."sequence" > (
    SELECT COALESCE(MIN(ii."sequence"), 1)
    FROM "InvoiceInstallment" ii
    WHERE ii."invoiceId" = inst."invoiceId"
      AND ii."status" = 'PENDING'
  );
