-- Catalogue produits personnalisé (stack tech à l'inscription / par client)

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "preferredTechnologies" JSONB;

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "preferredTechnologies" JSONB;

CREATE TABLE IF NOT EXISTS "OrganizationCatalogItem" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'algorithm',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationCatalogItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrganizationCatalogItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationCatalogItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationCatalogItem_organizationId_productId_key" ON "OrganizationCatalogItem"("organizationId", "productId");
CREATE INDEX IF NOT EXISTS "OrganizationCatalogItem_organizationId_sortOrder_idx" ON "OrganizationCatalogItem"("organizationId", "sortOrder");

CREATE TABLE IF NOT EXISTS "ClientCatalogItem" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'algorithm',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientCatalogItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ClientCatalogItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientCatalogItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClientCatalogItem_clientId_productId_key" ON "ClientCatalogItem"("clientId", "productId");
CREATE INDEX IF NOT EXISTS "ClientCatalogItem_clientId_sortOrder_idx" ON "ClientCatalogItem"("clientId", "sortOrder");
