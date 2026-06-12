-- CreateTable
CREATE TABLE "InvoiceInstallment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentId" INTEGER,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvoiceInstallment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceInstallment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceInstallment_invoiceId_sequence_key" ON "InvoiceInstallment"("invoiceId", "sequence");
CREATE INDEX "InvoiceInstallment_invoiceId_idx" ON "InvoiceInstallment"("invoiceId");
CREATE INDEX "InvoiceInstallment_invoiceId_status_idx" ON "InvoiceInstallment"("invoiceId", "status");
CREATE INDEX "InvoiceInstallment_dueDate_idx" ON "InvoiceInstallment"("dueDate");
