-- Programme beta testeurs : codes d'invitation et suivi organisation.

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "betaTesterAt" DATETIME;

-- CreateTable
CREATE TABLE "BetaInviteCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "note" TEXT,
    "expiresAt" DATETIME,
    "redeemedAt" DATETIME,
    "redeemedOrganizationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BetaInviteCode_redeemedOrganizationId_fkey" FOREIGN KEY ("redeemedOrganizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaInviteCode_code_key" ON "BetaInviteCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BetaInviteCode_redeemedOrganizationId_key" ON "BetaInviteCode"("redeemedOrganizationId");

-- CreateIndex
CREATE INDEX "BetaInviteCode_redeemedAt_idx" ON "BetaInviteCode"("redeemedAt");
