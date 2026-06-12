/*
  Warnings:

  - You are about to alter the column `defaultAmount` on the `DeliverableCatalogItem` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `techStack` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `documentTagLibrary` on the `User` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliverableCatalogItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "labelKey" TEXT NOT NULL,
    "defaultAmount" DECIMAL,
    "defaultHours" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliverableCatalogItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DeliverableCatalogItem" ("createdAt", "defaultAmount", "defaultHours", "id", "label", "labelKey", "organizationId", "updatedAt") SELECT "createdAt", "defaultAmount", "defaultHours", "id", "label", "labelKey", "organizationId", "updatedAt" FROM "DeliverableCatalogItem";
DROP TABLE "DeliverableCatalogItem";
ALTER TABLE "new_DeliverableCatalogItem" RENAME TO "DeliverableCatalogItem";
CREATE INDEX "DeliverableCatalogItem_organizationId_idx" ON "DeliverableCatalogItem"("organizationId");
CREATE UNIQUE INDEX "DeliverableCatalogItem_organizationId_labelKey_key" ON "DeliverableCatalogItem"("organizationId", "labelKey");
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
    "techStack" JSONB,
    "details" JSONB,
    "estimatedHours" INTEGER,
    "description" TEXT,
    "visualType" TEXT DEFAULT 'icon',
    "iconName" TEXT,
    "imageData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_defaultTaxRateId_fkey" FOREIGN KEY ("defaultTaxRateId") REFERENCES "TaxRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_templateProductId_fkey" FOREIGN KEY ("templateProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("category", "createdAt", "defaultTaxRateId", "description", "details", "estimatedHours", "iconName", "id", "imageData", "kind", "languages", "name", "organizationId", "purpose", "sku", "techStack", "templateProductId", "unitPrice", "updatedAt", "visualType") SELECT "category", "createdAt", "defaultTaxRateId", "description", "details", "estimatedHours", "iconName", "id", "imageData", "kind", "languages", "name", "organizationId", "purpose", "sku", "techStack", "templateProductId", "unitPrice", "updatedAt", "visualType" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");
CREATE INDEX "Product_templateProductId_idx" ON "Product"("templateProductId");
CREATE UNIQUE INDEX "Product_organizationId_sku_key" ON "Product"("organizationId", "sku");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" DATETIME,
    "lastLoginAt" DATETIME,
    "googleId" TEXT,
    "googleEmail" TEXT,
    "googlePicture" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" DATETIME,
    "organizationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "privacyConsentAt" DATETIME,
    "termsAcceptedAt" DATETIME,
    "documentTagLibrary" JSONB,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatar", "createdAt", "documentTagLibrary", "email", "emailVerificationExpires", "emailVerificationToken", "emailVerified", "emailVerifiedAt", "firstName", "googleEmail", "googleId", "googlePicture", "id", "lastLoginAt", "lastName", "organizationId", "password", "passwordResetExpires", "passwordResetToken", "phone", "privacyConsentAt", "role", "status", "termsAcceptedAt", "twoFactorEnabled", "twoFactorSecret", "updatedAt") SELECT "avatar", "createdAt", "documentTagLibrary", "email", "emailVerificationExpires", "emailVerificationToken", "emailVerified", "emailVerifiedAt", "firstName", "googleEmail", "googleId", "googlePicture", "id", "lastLoginAt", "lastName", "organizationId", "password", "passwordResetExpires", "passwordResetToken", "phone", "privacyConsentAt", "role", "status", "termsAcceptedAt", "twoFactorEnabled", "twoFactorSecret", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_googleId_idx" ON "User"("googleId");
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "User_passwordResetToken_idx" ON "User"("passwordResetToken");
CREATE INDEX "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
