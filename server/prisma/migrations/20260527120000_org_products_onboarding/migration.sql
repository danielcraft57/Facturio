-- Produits par organisation + assistant post-inscription

ALTER TABLE "Organization" ADD COLUMN "onboardingCompletedAt" DATETIME;

UPDATE "Organization" SET "onboardingCompletedAt" = CURRENT_TIMESTAMP WHERE "onboardingCompletedAt" IS NULL;

PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER,
    "templateProductId" INTEGER,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'SERVICE',
    "unitPrice" DECIMAL,
    "defaultTaxRateId" INTEGER,
    "purpose" TEXT,
    "category" TEXT,
    "languages" JSONB,
    "details" JSONB,
    "estimatedHours" INTEGER,
    "description" TEXT,
    "visualType" TEXT DEFAULT 'icon',
    "iconName" TEXT,
    "imageData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Product_templateProductId_fkey" FOREIGN KEY ("templateProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_defaultTaxRateId_fkey" FOREIGN KEY ("defaultTaxRateId") REFERENCES "TaxRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("id", "organizationId", "templateProductId", "name", "sku", "kind", "unitPrice", "defaultTaxRateId", "purpose", "category", "languages", "details", "estimatedHours", "description", "visualType", "iconName", "imageData", "createdAt", "updatedAt")
SELECT "id", NULL, NULL, "name", "sku", "kind", "unitPrice", "defaultTaxRateId", "purpose", "category", "languages", "details", "estimatedHours", "description", "visualType", "iconName", "imageData", "createdAt", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_organizationId_sku_key" ON "Product"("organizationId", "sku");
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");
CREATE INDEX "Product_templateProductId_idx" ON "Product"("templateProductId");
PRAGMA foreign_keys=ON;
