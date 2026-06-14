-- Emails rappel fin période beta (60j, 30j, 7j, expiration)
ALTER TABLE "Organization" ADD COLUMN "betaReminder60SentAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "betaReminder30SentAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "betaReminder7SentAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "betaExpiredNoticeSentAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "freeQuotaEmailsSentMonth" JSONB;
