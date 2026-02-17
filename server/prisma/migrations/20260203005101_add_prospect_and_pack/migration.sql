/*
  Warnings:

  - You are about to drop the `_AmortizationMethod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TaxCreditStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TaxCreditType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TaxDeductionCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TaxDeductionStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TaxSimulationScenario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to alter the column `schedule` on the `Amortization` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `documents` on the `TaxCredit` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `optimizations` on the `TaxSimulation` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Made the column `email` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_AmortizationMethod";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_TaxCreditStatus";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_TaxCreditType";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_TaxDeductionCategory";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_TaxDeductionStatus";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_TaxSimulationScenario";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "siret" TEXT,
    "siren" TEXT,
    "rcs" TEXT,
    "rcsCity" TEXT,
    "vatNumber" TEXT,
    "companyStatus" TEXT,
    "companyType" TEXT NOT NULL DEFAULT 'B2B',
    "address" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "countryCode" TEXT NOT NULL DEFAULT 'FR',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "capital" DECIMAL,
    "legalForm" TEXT,
    "apeCode" TEXT,
    "apeLabel" TEXT,
    "legalRepresentative" TEXT,
    "legalRepresentativeRole" TEXT,
    "accountingYearEnd" TEXT,
    "fiscalYear" INTEGER,
    "taxRegime" TEXT,
    "urssafRate" DECIMAL,
    "urssafActivity" TEXT,
    "urssafFiscalOption" BOOLEAN NOT NULL DEFAULT false,
    "urssafDeclarationFrequency" TEXT,
    "urssafThreshold" DECIMAL,
    "logo" TEXT,
    "signature" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'fr',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
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
    "organizationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrganizationDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME,
    "uploadedBy" INTEGER,
    "validatedBy" INTEGER,
    "validatedAt" DATETIME,
    "rejectionReason" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrganizationDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvoirLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "avoirId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL NOT NULL DEFAULT 0,
    "taxRate" DECIMAL NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "AvoirLine_avoirId_fkey" FOREIGN KEY ("avoirId") REFERENCES "Avoir" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvoirApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "avoirId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvoirApplication_avoirId_fkey" FOREIGN KEY ("avoirId") REFERENCES "Avoir" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AvoirApplication_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "journalId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "memo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalDebit" DECIMAL NOT NULL DEFAULT 0,
    "totalCredit" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entryId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "description" TEXT,
    "debit" DECIMAL NOT NULL DEFAULT 0,
    "credit" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL,
    "revenue" DECIMAL,
    "employees" INTEGER,
    "description" TEXT,
    "painPoints" TEXT,
    "budget" TEXT,
    "decisionMakerName" TEXT,
    "decisionMakerPosition" TEXT,
    "decisionMakerEmail" TEXT,
    "decisionMakerPhone" TEXT,
    "decisionMakerLinkedin" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "sourceType" TEXT NOT NULL DEFAULT 'DIRECT',
    "sourceName" TEXT,
    "sourceCost" DECIMAL,
    "sourceConversionRate" DECIMAL,
    "score" INTEGER NOT NULL DEFAULT 50,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "lastContact" DATETIME,
    "nextFollowUp" DATETIME,
    "notes" TEXT,
    "tags" TEXT,
    "organizationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prospect_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pack" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "products" TEXT,
    "totalHours" INTEGER NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL NOT NULL DEFAULT 0,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,
    "features" TEXT,
    "deliveryTime" INTEGER,
    "organizationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pack_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Amortization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "assetName" TEXT NOT NULL,
    "assetDescription" TEXT,
    "purchaseDate" DATETIME NOT NULL,
    "purchaseAmount" DECIMAL NOT NULL,
    "residualValue" DECIMAL NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "coefficient" DECIMAL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "schedule" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Amortization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Amortization" ("assetDescription", "assetName", "coefficient", "createdAt", "duration", "endYear", "id", "method", "organizationId", "purchaseAmount", "purchaseDate", "residualValue", "schedule", "startYear", "updatedAt") SELECT "assetDescription", "assetName", "coefficient", "createdAt", "duration", "endYear", "id", "method", "organizationId", "purchaseAmount", "purchaseDate", "residualValue", "schedule", "startYear", "updatedAt" FROM "Amortization";
DROP TABLE "Amortization";
ALTER TABLE "new_Amortization" RENAME TO "Amortization";
CREATE INDEX "Amortization_organizationId_startYear_idx" ON "Amortization"("organizationId", "startYear");
CREATE TABLE "new_Avoir" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "invoiceId" INTEGER,
    "clientId" INTEGER NOT NULL,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "tax" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    "appliedAmount" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "legalMention" TEXT,
    "accountingEntryId" INTEGER,
    "organizationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Avoir_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Avoir_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Avoir_accountingEntryId_fkey" FOREIGN KEY ("accountingEntryId") REFERENCES "JournalEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Avoir_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Avoir" ("accountingEntryId", "appliedAmount", "clientId", "createdAt", "currency", "date", "id", "invoiceId", "legalMention", "number", "organizationId", "status", "subtotal", "tax", "total", "updatedAt") SELECT "accountingEntryId", "appliedAmount", "clientId", "createdAt", "currency", "date", "id", "invoiceId", "legalMention", "number", "organizationId", "status", "subtotal", "tax", "total", "updatedAt" FROM "Avoir";
DROP TABLE "Avoir";
ALTER TABLE "new_Avoir" RENAME TO "Avoir";
CREATE UNIQUE INDEX "Avoir_number_key" ON "Avoir"("number");
CREATE INDEX "Avoir_status_date_idx" ON "Avoir"("status", "date");
CREATE INDEX "Avoir_clientId_idx" ON "Avoir"("clientId");
CREATE INDEX "Avoir_invoiceId_idx" ON "Avoir"("invoiceId");
CREATE INDEX "Avoir_number_idx" ON "Avoir"("number");
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "companyName" TEXT,
    "vatNumber" TEXT,
    "isVatExempt" BOOLEAN NOT NULL DEFAULT false,
    "taxRateOverrideId" INTEGER,
    "countryCode" TEXT,
    "organizationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_taxRateOverrideId_fkey" FOREIGN KEY ("taxRateOverrideId") REFERENCES "TaxRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("address", "companyName", "countryCode", "createdAt", "email", "id", "isCompany", "isVatExempt", "name", "taxRateOverrideId", "updatedAt", "vatNumber") SELECT "address", "companyName", "countryCode", "createdAt", "email", "id", "isCompany", "isVatExempt", "name", "taxRateOverrideId", "updatedAt", "vatNumber" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_name_idx" ON "Client"("name");
CREATE INDEX "Client_organizationId_idx" ON "Client"("organizationId");
CREATE TABLE "new_Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "clientId" INTEGER NOT NULL,
    "subscriptionId" INTEGER,
    "organizationId" INTEGER,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "tax" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "legalMention" TEXT,
    "publicToken" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("balance", "clientId", "createdAt", "currency", "date", "dueDate", "id", "legalMention", "number", "publicToken", "sentAt", "status", "subscriptionId", "subtotal", "tax", "total", "updatedAt") SELECT "balance", "clientId", "createdAt", "currency", "date", "dueDate", "id", "legalMention", "number", "publicToken", "sentAt", "status", "subscriptionId", "subtotal", "tax", "total", "updatedAt" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE UNIQUE INDEX "Invoice_publicToken_key" ON "Invoice"("publicToken");
CREATE INDEX "Invoice_status_date_idx" ON "Invoice"("status", "date");
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");
CREATE INDEX "Invoice_number_idx" ON "Invoice"("number");
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");
CREATE INDEX "Invoice_publicToken_idx" ON "Invoice"("publicToken");
CREATE TABLE "new_Quote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "clientId" INTEGER NOT NULL,
    "organizationId" INTEGER,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "tax" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    "publicToken" TEXT,
    "sentAt" DATETIME,
    "acceptedAt" DATETIME,
    "acceptedIp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("acceptedAt", "acceptedIp", "clientId", "createdAt", "date", "expiryDate", "id", "number", "publicToken", "sentAt", "status", "subtotal", "tax", "total", "updatedAt") SELECT "acceptedAt", "acceptedIp", "clientId", "createdAt", "date", "expiryDate", "id", "number", "publicToken", "sentAt", "status", "subtotal", "tax", "total", "updatedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");
CREATE UNIQUE INDEX "Quote_publicToken_key" ON "Quote"("publicToken");
CREATE INDEX "Quote_organizationId_idx" ON "Quote"("organizationId");
CREATE TABLE "new_Subscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "organizationId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("cancelAtPeriodEnd", "canceledAt", "clientId", "createdAt", "currentPeriodEnd", "currentPeriodStart", "id", "planId", "quantity", "startDate", "status", "updatedAt") SELECT "cancelAtPeriodEnd", "canceledAt", "clientId", "createdAt", "currentPeriodEnd", "currentPeriodStart", "id", "planId", "quantity", "startDate", "status", "updatedAt" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");
CREATE TABLE "new_TaxCredit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eligibleAmount" DECIMAL NOT NULL,
    "rate" DECIMAL NOT NULL,
    "creditAmount" DECIMAL NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ELIGIBLE',
    "documents" JSONB,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxCredit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TaxCredit" ("createdAt", "creditAmount", "description", "documents", "eligibleAmount", "id", "name", "notes", "organizationId", "rate", "status", "type", "updatedAt", "year") SELECT "createdAt", "creditAmount", "description", "documents", "eligibleAmount", "id", "name", "notes", "organizationId", "rate", "status", "type", "updatedAt", "year" FROM "TaxCredit";
DROP TABLE "TaxCredit";
ALTER TABLE "new_TaxCredit" RENAME TO "TaxCredit";
CREATE INDEX "TaxCredit_organizationId_year_idx" ON "TaxCredit"("organizationId", "year");
CREATE INDEX "TaxCredit_type_status_idx" ON "TaxCredit"("type", "status");
CREATE TABLE "new_TaxDeduction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL NOT NULL,
    "year" INTEGER NOT NULL,
    "deductibleRate" DECIMAL NOT NULL DEFAULT 1.0,
    "invoiceId" INTEGER,
    "documentId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxDeduction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaxDeduction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TaxDeduction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "OrganizationDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TaxDeduction" ("amount", "category", "createdAt", "deductibleRate", "description", "documentId", "id", "invoiceId", "name", "notes", "organizationId", "status", "updatedAt", "year") SELECT "amount", "category", "createdAt", "deductibleRate", "description", "documentId", "id", "invoiceId", "name", "notes", "organizationId", "status", "updatedAt", "year" FROM "TaxDeduction";
DROP TABLE "TaxDeduction";
ALTER TABLE "new_TaxDeduction" RENAME TO "TaxDeduction";
CREATE INDEX "TaxDeduction_organizationId_year_idx" ON "TaxDeduction"("organizationId", "year");
CREATE INDEX "TaxDeduction_status_idx" ON "TaxDeduction"("status");
CREATE TABLE "new_TaxSimulation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "scenario" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT,
    "revenue" DECIMAL NOT NULL,
    "expenses" DECIMAL NOT NULL,
    "deductions" DECIMAL NOT NULL,
    "amortizations" DECIMAL NOT NULL,
    "credits" DECIMAL NOT NULL,
    "taxableIncome" DECIMAL NOT NULL,
    "corporateTax" DECIMAL NOT NULL,
    "cfe" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "effectiveRate" DECIMAL NOT NULL,
    "optimizations" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxSimulation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TaxSimulation" ("amortizations", "cfe", "corporateTax", "createdAt", "credits", "deductions", "effectiveRate", "expenses", "id", "name", "optimizations", "organizationId", "revenue", "scenario", "taxableIncome", "totalTax", "updatedAt", "year") SELECT "amortizations", "cfe", "corporateTax", "createdAt", "credits", "deductions", "effectiveRate", "expenses", "id", "name", "optimizations", "organizationId", "revenue", "scenario", "taxableIncome", "totalTax", "updatedAt", "year" FROM "TaxSimulation";
DROP TABLE "TaxSimulation";
ALTER TABLE "new_TaxSimulation" RENAME TO "TaxSimulation";
CREATE INDEX "TaxSimulation_organizationId_year_idx" ON "TaxSimulation"("organizationId", "year");
CREATE INDEX "TaxSimulation_scenario_idx" ON "TaxSimulation"("scenario");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_siret_key" ON "Organization"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_vatNumber_key" ON "Organization"("vatNumber");

-- CreateIndex
CREATE INDEX "Organization_siret_idx" ON "Organization"("siret");

-- CreateIndex
CREATE INDEX "Organization_siren_idx" ON "Organization"("siren");

-- CreateIndex
CREATE INDEX "Organization_vatNumber_idx" ON "Organization"("vatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationDocument_organizationId_idx" ON "OrganizationDocument"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationDocument_type_idx" ON "OrganizationDocument"("type");

-- CreateIndex
CREATE INDEX "OrganizationDocument_status_idx" ON "OrganizationDocument"("status");

-- CreateIndex
CREATE INDEX "AvoirApplication_avoirId_idx" ON "AvoirApplication"("avoirId");

-- CreateIndex
CREATE INDEX "AvoirApplication_invoiceId_idx" ON "AvoirApplication"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_code_key" ON "Account"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_code_key" ON "Journal"("code");

-- CreateIndex
CREATE INDEX "Prospect_companyName_idx" ON "Prospect"("companyName");

-- CreateIndex
CREATE INDEX "Prospect_industry_idx" ON "Prospect"("industry");

-- CreateIndex
CREATE INDEX "Prospect_status_idx" ON "Prospect"("status");

-- CreateIndex
CREATE INDEX "Prospect_organizationId_idx" ON "Prospect"("organizationId");

-- CreateIndex
CREATE INDEX "Pack_organizationId_idx" ON "Pack"("organizationId");
