-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "saasPlan" TEXT NOT NULL DEFAULT 'FREE';
ALTER TABLE "Organization" ADD COLUMN "saasPlanExpiresAt" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "stripeSubscriptionId" TEXT;
