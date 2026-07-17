-- Multi-tenant : rattacher écritures comptables et déclarations à l'organisation
ALTER TABLE "JournalEntry" ADD COLUMN "organizationId" INTEGER;
CREATE INDEX "JournalEntry_organizationId_idx" ON "JournalEntry"("organizationId");
CREATE INDEX "JournalEntry_organizationId_reference_idx" ON "JournalEntry"("organizationId", "reference");
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Filing" ADD COLUMN "organizationId" INTEGER;
CREATE INDEX "Filing_organizationId_idx" ON "Filing"("organizationId");
ALTER TABLE "Filing" ADD CONSTRAINT "Filing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill écritures liées aux factures
UPDATE "JournalEntry" je
SET "organizationId" = inv."organizationId"
FROM "Invoice" inv
WHERE je."organizationId" IS NULL
  AND inv."organizationId" IS NOT NULL
  AND (
    je."reference" = 'VENTE ' || inv."number"
    OR je."reference" LIKE 'PAIEMENT ' || inv."number" || '%'
    OR je."reference" LIKE 'REMBOURSEMENT ' || inv."number" || '%'
    OR je."reference" = 'ANNUL VENTE ' || inv."number"
    OR je."reference" = 'ANNUL SOLDE VENTE ' || inv."number"
  );

-- Backfill écritures liées aux dettes payables
UPDATE "JournalEntry" je
SET "organizationId" = pd."organizationId"
FROM "PayableDebt" pd
WHERE je."organizationId" IS NULL
  AND (
    je."reference" = 'ACHAT DET-' || pd."id"::text
    OR je."reference" LIKE 'PAIEMENT DET-' || pd."id"::text || '#%'
    OR je."reference" = 'ANNUL ACHAT DET-' || pd."id"::text
    OR je."reference" = 'ANNUL SOLDE ACHAT DET-' || pd."id"::text
  );
