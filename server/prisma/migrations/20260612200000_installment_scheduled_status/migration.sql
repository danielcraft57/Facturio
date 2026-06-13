-- Échéances programmées : seule la mensualité active reste PENDING.
UPDATE "InvoiceInstallment"
SET "status" = 'SCHEDULED'
WHERE "status" = 'PENDING'
  AND "sequence" > (
    SELECT COALESCE(MIN(ii."sequence"), 1)
    FROM "InvoiceInstallment" ii
    WHERE ii."invoiceId" = "InvoiceInstallment"."invoiceId"
      AND ii."status" = 'PENDING'
  );
