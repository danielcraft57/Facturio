-- Snapshot de calcul déclarations + préférences fiscales org
ALTER TABLE "Filing" ADD COLUMN "calculationSnapshot" JSONB;
CREATE INDEX "Filing_organizationId_type_periodStart_idx" ON "Filing"("organizationId", "type", "periodStart");

ALTER TABLE "Organization" ADD COLUMN "cfePropertyValue" DECIMAL(65,30);
ALTER TABLE "Organization" ADD COLUMN "cfeCommunalRate" DECIMAL(65,30);
ALTER TABLE "Organization" ADD COLUMN "cfeActivity" TEXT;
ALTER TABLE "Organization" ADD COLUMN "isPmeEligible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Organization" ADD COLUMN "capitalHeldByIndividuals" DECIMAL(65,30);
