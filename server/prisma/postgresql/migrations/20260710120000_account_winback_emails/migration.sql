-- Emails win-back selon étape d'abandon (vérif email, onboarding, première facture)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "winbackVerifyEmailSentAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "winbackOnboardingSentAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "winbackFirstInvoiceSentAt" TIMESTAMP(3);
