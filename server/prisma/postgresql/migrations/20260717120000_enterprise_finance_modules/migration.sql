-- Référentiel fournisseurs + lien créancier
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "siret" TEXT,
    "vatNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "iban" TEXT,
    "bic" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");
CREATE INDEX "Supplier_organizationId_name_idx" ON "Supplier"("organizationId", "name");
CREATE INDEX "Supplier_organizationId_siret_idx" ON "Supplier"("organizationId", "siret");

ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PayableCreditor" ADD COLUMN "supplierId" INTEGER;
CREATE INDEX "PayableCreditor_supplierId_idx" ON "PayableCreditor"("supplierId");
ALTER TABLE "PayableCreditor" ADD CONSTRAINT "PayableCreditor_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enums PostgreSQL
CREATE TYPE "CashMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
CREATE TYPE "InvestorType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'FUND');
CREATE TYPE "InvestmentType" AS ENUM ('CAPITAL_CONTRIBUTION', 'LOAN', 'GRANT', 'OTHER');
CREATE TYPE "InvestmentStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CONVERTED');

-- Caisse
CREATE TABLE "CashRegister" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "openingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashRegister_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CashRegister_organizationId_idx" ON "CashRegister"("organizationId");
ALTER TABLE "CashRegister" ADD CONSTRAINT "CashRegister_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CashMovement" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "cashRegisterId" INTEGER NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT NOT NULL,
    "category" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CashMovement_organizationId_date_idx" ON "CashMovement"("organizationId", "date");
CREATE INDEX "CashMovement_cashRegisterId_date_idx" ON "CashMovement"("cashRegisterId", "date");
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Investisseurs / investissements
CREATE TABLE "Investor" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "type" "InvestorType" NOT NULL DEFAULT 'INDIVIDUAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Investor_organizationId_idx" ON "Investor"("organizationId");
ALTER TABLE "Investor" ADD CONSTRAINT "Investor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Investment" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "investorId" INTEGER,
    "label" TEXT NOT NULL,
    "type" "InvestmentType" NOT NULL DEFAULT 'CAPITAL_CONTRIBUTION',
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ownershipPercent" DECIMAL(65,30),
    "expectedReturnPercent" DECIMAL(65,30),
    "maturityDate" TIMESTAMP(3),
    "status" "InvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Investment_organizationId_idx" ON "Investment"("organizationId");
CREATE INDEX "Investment_investorId_idx" ON "Investment"("investorId");
CREATE INDEX "Investment_organizationId_status_idx" ON "Investment"("organizationId", "status");
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
