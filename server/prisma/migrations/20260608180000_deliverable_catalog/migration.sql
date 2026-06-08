CREATE TABLE "DeliverableCatalogItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "labelKey" TEXT NOT NULL,
    "defaultAmount" REAL,
    "defaultHours" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliverableCatalogItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DeliverableCatalogItem_organizationId_labelKey_key" ON "DeliverableCatalogItem"("organizationId", "labelKey");
CREATE INDEX "DeliverableCatalogItem_organizationId_idx" ON "DeliverableCatalogItem"("organizationId");
