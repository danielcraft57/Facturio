-- Lien devis → facture (conversion idempotente)
ALTER TABLE "Invoice" ADD COLUMN "sourceQuoteId" INTEGER;

CREATE UNIQUE INDEX "Invoice_sourceQuoteId_key" ON "Invoice"("sourceQuoteId");
