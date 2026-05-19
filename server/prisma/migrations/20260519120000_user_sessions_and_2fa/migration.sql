-- Sessions utilisateur (appareil / IP) + champs 2FA
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;

CREATE TABLE "UserSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "deviceFingerprint" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "verificationToken" TEXT,
    "verificationExpires" DATETIME,
    "revokedAt" DATETIME,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserSession_verificationToken_key" ON "UserSession"("verificationToken");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "UserSession_userId_deviceFingerprint_idx" ON "UserSession"("userId", "deviceFingerprint");
CREATE INDEX "UserSession_verificationToken_idx" ON "UserSession"("verificationToken");
CREATE INDEX "UserSession_lastActivityAt_idx" ON "UserSession"("lastActivityAt");
