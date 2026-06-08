CREATE TABLE "DeliverableCatalogItem" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "labelKey" TEXT NOT NULL,
    "defaultAmount" DECIMAL(65,30),
    "defaultHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverableCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliverableCatalogItem_organizationId_labelKey_key" ON "DeliverableCatalogItem"("organizationId", "labelKey");
CREATE INDEX "DeliverableCatalogItem_organizationId_idx" ON "DeliverableCatalogItem"("organizationId");

ALTER TABLE "DeliverableCatalogItem" ADD CONSTRAINT "DeliverableCatalogItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
