/*
  Warnings:

  - You are about to alter the column `languages` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `passwordResetExpires` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'SERVICE',
    "unitPrice" DECIMAL,
    "defaultTaxRateId" INTEGER,
    "category" TEXT,
    "languages" JSONB,
    "estimatedHours" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_defaultTaxRateId_fkey" FOREIGN KEY ("defaultTaxRateId") REFERENCES "TaxRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("category", "createdAt", "defaultTaxRateId", "description", "estimatedHours", "id", "kind", "languages", "name", "sku", "unitPrice", "updatedAt") SELECT "category", "createdAt", "defaultTaxRateId", "description", "estimatedHours", "id", "kind", "languages", "name", "sku", "unitPrice", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
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
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatar", "createdAt", "email", "emailVerified", "emailVerifiedAt", "firstName", "googleEmail", "googleId", "googlePicture", "id", "lastLoginAt", "lastName", "organizationId", "password", "passwordResetExpires", "passwordResetToken", "phone", "role", "status", "updatedAt") SELECT "avatar", "createdAt", "email", "emailVerified", "emailVerifiedAt", "firstName", "googleEmail", "googleId", "googlePicture", "id", "lastLoginAt", "lastName", "organizationId", "password", "passwordResetExpires", "passwordResetToken", "phone", "role", "status", "updatedAt" FROM "User";
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
