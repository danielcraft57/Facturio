-- Snapshot de calcul déclarations + préférences fiscales org (SQLite)
ALTER TABLE "Filing" ADD COLUMN "calculationSnapshot" JSON;
CREATE INDEX "Filing_organizationId_type_periodStart_idx" ON "Filing"("organizationId", "type", "periodStart");

ALTER TABLE "Organization" ADD COLUMN "cfePropertyValue" DECIMAL;
ALTER TABLE "Organization" ADD COLUMN "cfeCommunalRate" DECIMAL;
ALTER TABLE "Organization" ADD COLUMN "cfeActivity" TEXT;
ALTER TABLE "Organization" ADD COLUMN "isPmeEligible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Organization" ADD COLUMN "capitalHeldByIndividuals" DECIMAL;
