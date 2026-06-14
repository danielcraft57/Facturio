-- Programme beta testeurs : codes d'invitation et suivi organisation.

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "betaTesterAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BetaInviteCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "redeemedOrganizationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaInviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaInviteCode_code_key" ON "BetaInviteCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BetaInviteCode_redeemedOrganizationId_key" ON "BetaInviteCode"("redeemedOrganizationId");

-- CreateIndex
CREATE INDEX "BetaInviteCode_redeemedAt_idx" ON "BetaInviteCode"("redeemedAt");

-- AddForeignKey
ALTER TABLE "BetaInviteCode" ADD CONSTRAINT "BetaInviteCode_redeemedOrganizationId_fkey" FOREIGN KEY ("redeemedOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
