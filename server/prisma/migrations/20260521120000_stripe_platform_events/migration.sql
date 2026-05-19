-- Abonnement SaaS : statut Stripe + journal webhooks idempotent
ALTER TABLE "Organization" ADD COLUMN "saasSubscriptionStatus" TEXT;

CREATE TABLE "StripePlatformEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "organizationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StripePlatformEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "StripePlatformEvent_eventId_key" ON "StripePlatformEvent"("eventId");
CREATE INDEX "StripePlatformEvent_organizationId_idx" ON "StripePlatformEvent"("organizationId");
CREATE INDEX "StripePlatformEvent_type_idx" ON "StripePlatformEvent"("type");
