-- Codes beta réutilisables + table des inscriptions

CREATE TABLE "BetaInviteRedemption" (
    "id" SERIAL NOT NULL,
    "betaInviteCodeId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BetaInviteRedemption_pkey" PRIMARY KEY ("id")
);

INSERT INTO "BetaInviteRedemption" ("betaInviteCodeId", "organizationId", "redeemedAt")
SELECT "id", "redeemedOrganizationId", COALESCE("redeemedAt", CURRENT_TIMESTAMP)
FROM "BetaInviteCode"
WHERE "redeemedOrganizationId" IS NOT NULL;

CREATE UNIQUE INDEX "BetaInviteRedemption_organizationId_key" ON "BetaInviteRedemption"("organizationId");
CREATE INDEX "BetaInviteRedemption_betaInviteCodeId_idx" ON "BetaInviteRedemption"("betaInviteCodeId");

ALTER TABLE "BetaInviteCode" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "BetaInviteCode" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "BetaInviteCode" ADD COLUMN IF NOT EXISTS "maxRedemptions" INTEGER;
ALTER TABLE "BetaInviteCode" ADD COLUMN IF NOT EXISTS "redemptionCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "BetaInviteCode"
SET "redemptionCount" = sub.cnt
FROM (
    SELECT "betaInviteCodeId", COUNT(*)::int AS cnt
    FROM "BetaInviteRedemption"
    GROUP BY "betaInviteCodeId"
) AS sub
WHERE "BetaInviteCode"."id" = sub."betaInviteCodeId";

ALTER TABLE "BetaInviteCode" DROP COLUMN IF EXISTS "redeemedAt";
ALTER TABLE "BetaInviteCode" DROP COLUMN IF EXISTS "redeemedOrganizationId";

DROP INDEX IF EXISTS "BetaInviteCode_redeemedAt_idx";
DROP INDEX IF EXISTS "BetaInviteCode_redeemedOrganizationId_key";

CREATE INDEX IF NOT EXISTS "BetaInviteCode_active_idx" ON "BetaInviteCode"("active");

ALTER TABLE "BetaInviteRedemption" ADD CONSTRAINT "BetaInviteRedemption_betaInviteCodeId_fkey"
    FOREIGN KEY ("betaInviteCodeId") REFERENCES "BetaInviteCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BetaInviteRedemption" ADD CONSTRAINT "BetaInviteRedemption_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
