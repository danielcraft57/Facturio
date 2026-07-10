-- Emails win-back selon étape d'abandon (vérif email, onboarding, première facture)
ALTER TABLE "User" ADD COLUMN "winbackVerifyEmailSentAt" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "winbackOnboardingSentAt" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "winbackFirstInvoiceSentAt" DATETIME;
