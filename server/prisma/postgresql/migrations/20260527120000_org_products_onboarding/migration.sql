ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "templateProductId" INTEGER;

CREATE INDEX IF NOT EXISTS "Product_organizationId_idx" ON "Product"("organizationId");
CREATE INDEX IF NOT EXISTS "Product_templateProductId_idx" ON "Product"("templateProductId");

DROP INDEX IF EXISTS "Product_sku_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Product_organizationId_sku_key" ON "Product"("organizationId", "sku");

UPDATE "Organization" SET "onboardingCompletedAt" = CURRENT_TIMESTAMP WHERE "onboardingCompletedAt" IS NULL;

ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_templateProductId_fkey" FOREIGN KEY ("templateProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
