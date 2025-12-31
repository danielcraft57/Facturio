-- CreateEnum
CREATE TABLE IF NOT EXISTS "_TaxDeductionCategory" (
    "A" TEXT NOT NULL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS "_TaxDeductionStatus" (
    "A" TEXT NOT NULL PRIMARY KEY
);

-- CreateEnum
CREATE TABLE IF NOT EXISTS "_AmortizationMethod" (
    "A" TEXT NOT NULL PRIMARY KEY
);

-- CreateEnum
CREATE TABLE IF NOT EXISTS "_TaxCreditType" (
    "A" TEXT NOT NULL PRIMARY KEY
);

-- CreateEnum
CREATE TABLE IF NOT EXISTS "_TaxCreditStatus" (
    "A" TEXT NOT NULL PRIMARY KEY
);

-- CreateEnum
CREATE TABLE IF NOT EXISTS "_TaxSimulationScenario" (
    "A" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TaxDeduction" (
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

-- CreateTable
CREATE TABLE IF NOT EXISTS "Amortization" (
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
    "schedule" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Amortization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TaxCredit" (
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
    "documents" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxCredit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TaxSimulation" (
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
    "optimizations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxSimulation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaxDeduction_organizationId_year_idx" ON "TaxDeduction"("organizationId", "year");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaxDeduction_status_idx" ON "TaxDeduction"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Amortization_organizationId_startYear_idx" ON "Amortization"("organizationId", "startYear");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaxCredit_organizationId_year_idx" ON "TaxCredit"("organizationId", "year");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaxCredit_type_status_idx" ON "TaxCredit"("type", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaxSimulation_organizationId_year_idx" ON "TaxSimulation"("organizationId", "year");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaxSimulation_scenario_idx" ON "TaxSimulation"("scenario");

