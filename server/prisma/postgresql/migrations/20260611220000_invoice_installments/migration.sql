-- CreateEnum
CREATE TYPE "InvoiceInstallmentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "InvoiceInstallment" (
    "id" SERIAL NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceInstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" INTEGER,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceInstallment_invoiceId_sequence_key" ON "InvoiceInstallment"("invoiceId", "sequence");
CREATE INDEX "InvoiceInstallment_invoiceId_idx" ON "InvoiceInstallment"("invoiceId");
CREATE INDEX "InvoiceInstallment_invoiceId_status_idx" ON "InvoiceInstallment"("invoiceId", "status");
CREATE INDEX "InvoiceInstallment_dueDate_idx" ON "InvoiceInstallment"("dueDate");

-- AddForeignKey
ALTER TABLE "InvoiceInstallment" ADD CONSTRAINT "InvoiceInstallment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceInstallment" ADD CONSTRAINT "InvoiceInstallment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
