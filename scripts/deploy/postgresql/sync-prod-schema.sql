-- Synchronisation incrémentale PostgreSQL (prod) — idempotent
-- Aligné sur schema.postgresql.prisma lorsque prisma migrate deploy n'est pas utilisable (historique SQLite)

-- User : 2FA
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;

-- UserSession
CREATE TABLE IF NOT EXISTS "UserSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceFingerprint" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationToken" TEXT,
    "verificationExpires" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserSession_verificationToken_key" ON "UserSession"("verificationToken");
CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX IF NOT EXISTS "UserSession_userId_deviceFingerprint_idx" ON "UserSession"("userId", "deviceFingerprint");
CREATE INDEX IF NOT EXISTS "UserSession_verificationToken_idx" ON "UserSession"("verificationToken");
CREATE INDEX IF NOT EXISTS "UserSession_lastActivityAt_idx" ON "UserSession"("lastActivityAt");

-- Organization : SaaS + Stripe
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "saasPlan" TEXT NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "saasPlanExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "saasSubscriptionStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceStripePublishableKey" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceStripeSecretKey" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceStripeWebhookSecret" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceStripePaymentMethods" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceStripeConfiguredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "privacyPolicyUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "dataControllerEmail" TEXT;

-- StripePlatformEvent
CREATE TABLE IF NOT EXISTS "StripePlatformEvent" (
    "id" SERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "organizationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StripePlatformEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StripePlatformEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "StripePlatformEvent_eventId_key" ON "StripePlatformEvent"("eventId");
CREATE INDEX IF NOT EXISTS "StripePlatformEvent_organizationId_idx" ON "StripePlatformEvent"("organizationId");
CREATE INDEX IF NOT EXISTS "StripePlatformEvent_type_idx" ON "StripePlatformEvent"("type");

-- Client / Invoice (e-facture)
ALTER TABLE "Client"
  ADD COLUMN IF NOT EXISTS "siren" TEXT;

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "eInvoiceStatus" TEXT NOT NULL DEFAULT 'NOT_READY',
  ADD COLUMN IF NOT EXISTS "eInvoiceGeneratedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "eInvoiceXmlHash" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceQuoteId" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_sourceQuoteId_key" ON "Invoice"("sourceQuoteId") WHERE "sourceQuoteId" IS NOT NULL;
