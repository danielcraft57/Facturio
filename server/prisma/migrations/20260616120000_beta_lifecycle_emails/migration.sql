-- Emails rappel fin période beta (60j, 30j, 7j, expiration)
ALTER TABLE "Organization" ADD COLUMN "betaReminder60SentAt" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "betaReminder30SentAt" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "betaReminder7SentAt" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "betaExpiredNoticeSentAt" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "freeQuotaEmailsSentMonth" TEXT;
