-- Multi-tenant : rattacher écritures comptables et déclarations à l'organisation
ALTER TABLE "JournalEntry" ADD COLUMN "organizationId" INTEGER;
CREATE INDEX "JournalEntry_organizationId_idx" ON "JournalEntry"("organizationId");
CREATE INDEX "JournalEntry_organizationId_reference_idx" ON "JournalEntry"("organizationId", "reference");

ALTER TABLE "Filing" ADD COLUMN "organizationId" INTEGER;
CREATE INDEX "Filing_organizationId_idx" ON "Filing"("organizationId");

-- Backfill écritures liées aux factures (références VENTE / PAIEMENT / REMBOURSEMENT)
UPDATE "JournalEntry"
SET "organizationId" = (
  SELECT "Invoice"."organizationId"
  FROM "Invoice"
  WHERE (
    "JournalEntry"."reference" = ('VENTE ' || "Invoice"."number")
    OR "JournalEntry"."reference" LIKE ('PAIEMENT ' || "Invoice"."number" || '%')
    OR "JournalEntry"."reference" LIKE ('REMBOURSEMENT ' || "Invoice"."number" || '%')
    OR "JournalEntry"."reference" LIKE ('ANNUL VENTE ' || "Invoice"."number")
    OR "JournalEntry"."reference" LIKE ('ANNUL SOLDE VENTE ' || "Invoice"."number")
  )
  AND "Invoice"."organizationId" IS NOT NULL
  LIMIT 1
)
WHERE "organizationId" IS NULL;

-- Backfill écritures liées aux dettes payables
UPDATE "JournalEntry"
SET "organizationId" = (
  SELECT "PayableDebt"."organizationId"
  FROM "PayableDebt"
  WHERE (
    "JournalEntry"."reference" = ('ACHAT DET-' || CAST("PayableDebt"."id" AS TEXT))
    OR "JournalEntry"."reference" LIKE ('PAIEMENT DET-' || CAST("PayableDebt"."id" AS TEXT) || '#%')
    OR "JournalEntry"."reference" = ('ANNUL ACHAT DET-' || CAST("PayableDebt"."id" AS TEXT))
    OR "JournalEntry"."reference" = ('ANNUL SOLDE ACHAT DET-' || CAST("PayableDebt"."id" AS TEXT))
  )
  LIMIT 1
)
WHERE "organizationId" IS NULL;
