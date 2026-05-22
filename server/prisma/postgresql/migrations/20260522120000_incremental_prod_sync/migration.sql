-- Migration PostgreSQL idempotente : bases prod déjà créées avant l'historique Prisma dédié.
-- Les prochaines migrations dans prisma/postgresql/migrations/ seront des ALTER classiques.

-- Auth / reset email (si manquants)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "privacyConsentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_passwordResetToken_key" ON "User"("passwordResetToken");
CREATE UNIQUE INDEX IF NOT EXISTS "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
CREATE INDEX IF NOT EXISTS "User_passwordResetToken_idx" ON "User"("passwordResetToken");
CREATE INDEX IF NOT EXISTS "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");

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

-- Organization : SaaS + Stripe + RGPD
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
