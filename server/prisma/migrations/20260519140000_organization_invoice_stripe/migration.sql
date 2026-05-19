-- Stripe prestataire (paiements factures clients) — séparé du Stripe plateforme (.env)
ALTER TABLE "Organization" ADD COLUMN "invoiceStripePublishableKey" TEXT;
ALTER TABLE "Organization" ADD COLUMN "invoiceStripeSecretKey" TEXT;
ALTER TABLE "Organization" ADD COLUMN "invoiceStripeWebhookSecret" TEXT;
ALTER TABLE "Organization" ADD COLUMN "invoiceStripeConfiguredAt" DATETIME;
