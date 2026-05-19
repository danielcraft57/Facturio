-- Consentements utilisateur + contact RGPD organisation
ALTER TABLE "User" ADD COLUMN "privacyConsentAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "privacyPolicyUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN "dataControllerEmail" TEXT;
