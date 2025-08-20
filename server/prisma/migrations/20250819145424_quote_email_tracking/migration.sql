/*
  Warnings:

  - A unique constraint covering the columns `[publicToken]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "acceptedAt" DATETIME;
ALTER TABLE "Quote" ADD COLUMN "acceptedIp" TEXT;
ALTER TABLE "Quote" ADD COLUMN "publicToken" TEXT;
ALTER TABLE "Quote" ADD COLUMN "sentAt" DATETIME;

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER,
    "invoiceId" INTEGER,
    "type" TEXT NOT NULL,
    "providerId" TEXT,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailEvent_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmailEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteView_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_publicToken_key" ON "Quote"("publicToken");
