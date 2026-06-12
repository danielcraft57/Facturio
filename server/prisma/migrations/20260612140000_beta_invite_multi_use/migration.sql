-- Codes beta réutilisables + table des inscriptions

CREATE TABLE "BetaInviteRedemption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "betaInviteCodeId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "redeemedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BetaInviteRedemption_betaInviteCodeId_fkey" FOREIGN KEY ("betaInviteCodeId") REFERENCES "BetaInviteCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BetaInviteRedemption_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "BetaInviteRedemption" ("betaInviteCodeId", "organizationId", "redeemedAt")
SELECT "id", "redeemedOrganizationId", COALESCE("redeemedAt", CURRENT_TIMESTAMP)
FROM "BetaInviteCode"
WHERE "redeemedOrganizationId" IS NOT NULL;

CREATE UNIQUE INDEX "BetaInviteRedemption_organizationId_key" ON "BetaInviteRedemption"("organizationId");
CREATE INDEX "BetaInviteRedemption_betaInviteCodeId_idx" ON "BetaInviteRedemption"("betaInviteCodeId");

ALTER TABLE "BetaInviteCode" ADD COLUMN "label" TEXT;
ALTER TABLE "BetaInviteCode" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "BetaInviteCode" ADD COLUMN "maxRedemptions" INTEGER;
ALTER TABLE "BetaInviteCode" ADD COLUMN "redemptionCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "BetaInviteCode"
SET "redemptionCount" = (
    SELECT COUNT(*) FROM "BetaInviteRedemption" r WHERE r."betaInviteCodeId" = "BetaInviteCode"."id"
);

CREATE TABLE "new_BetaInviteCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "note" TEXT,
    "expiresAt" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_BetaInviteCode" ("id", "code", "label", "note", "expiresAt", "active", "maxRedemptions", "redemptionCount", "createdAt")
SELECT "id", "code", "label", "note", "expiresAt", "active", "maxRedemptions", "redemptionCount", "createdAt"
FROM "BetaInviteCode";

DROP TABLE "BetaInviteCode";
ALTER TABLE "new_BetaInviteCode" RENAME TO "BetaInviteCode";

CREATE UNIQUE INDEX "BetaInviteCode_code_key" ON "BetaInviteCode"("code");
CREATE INDEX "BetaInviteCode_active_idx" ON "BetaInviteCode"("active");
