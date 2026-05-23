-- IDs publics Client / Facture / Devis : cuid(). Données métier liées supprimées (réimport seed si besoin).
DELETE FROM "JournalLine";
DELETE FROM "JournalEntry";
DELETE FROM "QuoteView";
DELETE FROM "EmailEvent";
DELETE FROM "QuoteLine";
DELETE FROM "Quote";
DELETE FROM "AvoirApplication";
DELETE FROM "AvoirLine";
DELETE FROM "Avoir";
DELETE FROM "Payment";
DELETE FROM "InvoiceLine";
DELETE FROM "TaxDeduction" WHERE "invoiceId" IS NOT NULL;
DELETE FROM "Invoice";
DELETE FROM "Subscription";
DELETE FROM "Client";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Avoir" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "invoiceId" TEXT,
    "clientId" TEXT NOT NULL,
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
DROP TABLE "Avoir";
ALTER TABLE "new_Avoir" RENAME TO "Avoir";
CREATE UNIQUE INDEX "Avoir_number_key" ON "Avoir"("number");
CREATE INDEX "Avoir_status_date_idx" ON "Avoir"("status", "date");
CREATE INDEX "Avoir_clientId_idx" ON "Avoir"("clientId");
CREATE INDEX "Avoir_invoiceId_idx" ON "Avoir"("invoiceId");
CREATE INDEX "Avoir_number_idx" ON "Avoir"("number");
CREATE TABLE "new_AvoirApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "avoirId" INTEGER NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvoirApplication_avoirId_fkey" FOREIGN KEY ("avoirId") REFERENCES "Avoir" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AvoirApplication_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
DROP TABLE "AvoirApplication";
ALTER TABLE "new_AvoirApplication" RENAME TO "AvoirApplication";
CREATE INDEX "AvoirApplication_avoirId_idx" ON "AvoirApplication"("avoirId");
CREATE INDEX "AvoirApplication_invoiceId_idx" ON "AvoirApplication"("invoiceId");
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "companyName" TEXT,
    "siren" TEXT,
    "vatNumber" TEXT,
    "isVatExempt" BOOLEAN NOT NULL DEFAULT false,
    "taxRateOverrideId" INTEGER,
    "countryCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "organizationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_taxRateOverrideId_fkey" FOREIGN KEY ("taxRateOverrideId") REFERENCES "TaxRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_name_idx" ON "Client"("name");
CREATE INDEX "Client_organizationId_idx" ON "Client"("organizationId");
CREATE INDEX "Client_status_idx" ON "Client"("status");
CREATE INDEX "Client_isCompany_idx" ON "Client"("isCompany");
CREATE INDEX "Client_organizationId_createdAt_idx" ON "Client"("organizationId", "createdAt");
CREATE INDEX "Client_organizationId_status_createdAt_idx" ON "Client"("organizationId", "status", "createdAt");
CREATE INDEX "Client_organizationId_isCompany_createdAt_idx" ON "Client"("organizationId", "isCompany", "createdAt");
CREATE TABLE "new_EmailEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" TEXT,
    "invoiceId" TEXT,
    "type" TEXT NOT NULL,
    "providerId" TEXT,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailEvent_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmailEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "EmailEvent";
ALTER TABLE "new_EmailEvent" RENAME TO "EmailEvent";
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "clientId" TEXT NOT NULL,
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
    "sourceQuoteId" TEXT,
    "eInvoiceStatus" TEXT NOT NULL DEFAULT 'NOT_READY',
    "eInvoiceGeneratedAt" DATETIME,
    "eInvoiceXmlHash" TEXT,
    "archivedAt" DATETIME,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "snoozedUntil" DATETIME,
    "seenAt" DATETIME,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_sourceQuoteId_fkey" FOREIGN KEY ("sourceQuoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE UNIQUE INDEX "Invoice_publicToken_key" ON "Invoice"("publicToken");
CREATE UNIQUE INDEX "Invoice_sourceQuoteId_key" ON "Invoice"("sourceQuoteId");
CREATE INDEX "Invoice_status_date_idx" ON "Invoice"("status", "date");
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");
CREATE INDEX "Invoice_archivedAt_idx" ON "Invoice"("archivedAt");
CREATE INDEX "Invoice_starred_idx" ON "Invoice"("starred");
CREATE INDEX "Invoice_important_idx" ON "Invoice"("important");
CREATE INDEX "Invoice_number_idx" ON "Invoice"("number");
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");
CREATE INDEX "Invoice_publicToken_idx" ON "Invoice"("publicToken");
CREATE INDEX "Invoice_eInvoiceStatus_idx" ON "Invoice"("eInvoiceStatus");
CREATE INDEX "Invoice_organizationId_archivedAt_createdAt_idx" ON "Invoice"("organizationId", "archivedAt", "createdAt");
CREATE INDEX "Invoice_organizationId_archivedAt_status_idx" ON "Invoice"("organizationId", "archivedAt", "status");
CREATE INDEX "Invoice_organizationId_archivedAt_seenAt_idx" ON "Invoice"("organizationId", "archivedAt", "seenAt");
CREATE INDEX "Invoice_organizationId_archivedAt_snoozedUntil_idx" ON "Invoice"("organizationId", "archivedAt", "snoozedUntil");
CREATE INDEX "Invoice_organizationId_archivedAt_starred_idx" ON "Invoice"("organizationId", "archivedAt", "starred");
CREATE INDEX "Invoice_organizationId_archivedAt_important_idx" ON "Invoice"("organizationId", "archivedAt", "important");
CREATE INDEX "Invoice_organizationId_clientId_status_idx" ON "Invoice"("organizationId", "clientId", "status");
CREATE TABLE "new_InvoiceLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" TEXT NOT NULL,
    "productId" INTEGER,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL NOT NULL DEFAULT 0,
    "taxRate" DECIMAL NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "InvoiceLine";
ALTER TABLE "new_InvoiceLine" RENAME TO "InvoiceLine";
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    CONSTRAINT "Product_defaultTaxRateId_fkey" FOREIGN KEY ("defaultTaxRateId") REFERENCES "TaxRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "clientId" TEXT NOT NULL,
    "organizationId" INTEGER,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "tax" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    "publicToken" TEXT,
    "sentAt" DATETIME,
    "acceptedAt" DATETIME,
    "acceptedIp" TEXT,
    "archivedAt" DATETIME,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "snoozedUntil" DATETIME,
    "seenAt" DATETIME,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_number_key" ON "Quote"("number");
CREATE UNIQUE INDEX "Quote_publicToken_key" ON "Quote"("publicToken");
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");
CREATE INDEX "Quote_status_idx" ON "Quote"("status");
CREATE INDEX "Quote_number_idx" ON "Quote"("number");
CREATE INDEX "Quote_snoozedUntil_idx" ON "Quote"("snoozedUntil");
CREATE INDEX "Quote_seenAt_idx" ON "Quote"("seenAt");
CREATE INDEX "Quote_sentAt_idx" ON "Quote"("sentAt");
CREATE INDEX "Quote_organizationId_idx" ON "Quote"("organizationId");
CREATE INDEX "Quote_archivedAt_idx" ON "Quote"("archivedAt");
CREATE INDEX "Quote_starred_idx" ON "Quote"("starred");
CREATE INDEX "Quote_important_idx" ON "Quote"("important");
CREATE INDEX "Quote_organizationId_archivedAt_createdAt_idx" ON "Quote"("organizationId", "archivedAt", "createdAt");
CREATE INDEX "Quote_organizationId_archivedAt_status_idx" ON "Quote"("organizationId", "archivedAt", "status");
CREATE INDEX "Quote_organizationId_archivedAt_seenAt_idx" ON "Quote"("organizationId", "archivedAt", "seenAt");
CREATE INDEX "Quote_organizationId_archivedAt_snoozedUntil_idx" ON "Quote"("organizationId", "archivedAt", "snoozedUntil");
CREATE INDEX "Quote_organizationId_archivedAt_starred_idx" ON "Quote"("organizationId", "archivedAt", "starred");
CREATE INDEX "Quote_organizationId_archivedAt_important_idx" ON "Quote"("organizationId", "archivedAt", "important");
CREATE TABLE "new_QuoteLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" TEXT NOT NULL,
    "productId" INTEGER,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL NOT NULL DEFAULT 0,
    "taxRate" DECIMAL NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "QuoteLine";
ALTER TABLE "new_QuoteLine" RENAME TO "QuoteLine";
CREATE TABLE "new_QuoteView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteView_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
DROP TABLE "QuoteView";
ALTER TABLE "new_QuoteView" RENAME TO "QuoteView";
CREATE TABLE "new_Subscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" TEXT NOT NULL,
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
    CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");
CREATE TABLE "new_TaxDeduction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL NOT NULL,
    "year" INTEGER NOT NULL,
    "deductibleRate" DECIMAL NOT NULL DEFAULT 1.0,
    "invoiceId" TEXT,
    "documentId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxDeduction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaxDeduction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TaxDeduction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "OrganizationDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "TaxDeduction";
ALTER TABLE "new_TaxDeduction" RENAME TO "TaxDeduction";
CREATE INDEX "TaxDeduction_organizationId_year_idx" ON "TaxDeduction"("organizationId", "year");
CREATE INDEX "TaxDeduction_status_idx" ON "TaxDeduction"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
