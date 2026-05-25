-- IDs publics Client / Facture / Devis : TEXT (cuid côté application).
-- Données métier liées supprimées ; idempotent si colonnes déjà en TEXT.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Client' AND column_name = 'id'
      AND data_type IN ('integer', 'bigint')
  ) THEN
    DELETE FROM "TaxDeduction" WHERE "invoiceId" IS NOT NULL;
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
    DELETE FROM "Invoice";
    DELETE FROM "Subscription";
    DELETE FROM "Client";

    -- Supprimer les FK avant ALTER TYPE (sinon Client.id → TEXT échoue tant que clientId est integer).
    ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_clientId_fkey";
    ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_clientId_fkey";
    ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_sourceQuoteId_fkey";
    ALTER TABLE "InvoiceLine" DROP CONSTRAINT IF EXISTS "InvoiceLine_invoiceId_fkey";
    ALTER TABLE "QuoteLine" DROP CONSTRAINT IF EXISTS "QuoteLine_quoteId_fkey";
    ALTER TABLE "QuoteView" DROP CONSTRAINT IF EXISTS "QuoteView_quoteId_fkey";
    ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_invoiceId_fkey";
    ALTER TABLE "Avoir" DROP CONSTRAINT IF EXISTS "Avoir_clientId_fkey";
    ALTER TABLE "Avoir" DROP CONSTRAINT IF EXISTS "Avoir_invoiceId_fkey";
    ALTER TABLE "AvoirApplication" DROP CONSTRAINT IF EXISTS "AvoirApplication_invoiceId_fkey";
    ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_clientId_fkey";
    ALTER TABLE "EmailEvent" DROP CONSTRAINT IF EXISTS "EmailEvent_quoteId_fkey";
    ALTER TABLE "EmailEvent" DROP CONSTRAINT IF EXISTS "EmailEvent_invoiceId_fkey";
    ALTER TABLE "TaxDeduction" DROP CONSTRAINT IF EXISTS "TaxDeduction_invoiceId_fkey";

    ALTER TABLE "Client" ALTER COLUMN "id" DROP DEFAULT;
    DROP SEQUENCE IF EXISTS "Client_id_seq";
    ALTER TABLE "Client" ALTER COLUMN "id" TYPE TEXT;

    ALTER TABLE "Quote" ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE "Quote" ALTER COLUMN "clientId" TYPE TEXT;

    ALTER TABLE "Invoice" ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE "Invoice" ALTER COLUMN "clientId" TYPE TEXT;
    ALTER TABLE "Invoice" ALTER COLUMN "sourceQuoteId" TYPE TEXT;

    ALTER TABLE "InvoiceLine" ALTER COLUMN "invoiceId" TYPE TEXT;
    ALTER TABLE "QuoteLine" ALTER COLUMN "quoteId" TYPE TEXT;
    ALTER TABLE "QuoteView" ALTER COLUMN "quoteId" TYPE TEXT;
    ALTER TABLE "Payment" ALTER COLUMN "invoiceId" TYPE TEXT;
    ALTER TABLE "Avoir" ALTER COLUMN "clientId" TYPE TEXT;
    ALTER TABLE "Avoir" ALTER COLUMN "invoiceId" TYPE TEXT;
    ALTER TABLE "AvoirApplication" ALTER COLUMN "invoiceId" TYPE TEXT;
    ALTER TABLE "Subscription" ALTER COLUMN "clientId" TYPE TEXT;
    ALTER TABLE "EmailEvent" ALTER COLUMN "quoteId" TYPE TEXT;
    ALTER TABLE "EmailEvent" ALTER COLUMN "invoiceId" TYPE TEXT;
    ALTER TABLE "TaxDeduction" ALTER COLUMN "invoiceId" TYPE TEXT;

    ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_sourceQuoteId_fkey"
      FOREIGN KEY ("sourceQuoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

    ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    ALTER TABLE "QuoteView" ADD CONSTRAINT "QuoteView_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "Avoir" ADD CONSTRAINT "Avoir_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "Avoir" ADD CONSTRAINT "Avoir_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

    ALTER TABLE "AvoirApplication" ADD CONSTRAINT "AvoirApplication_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

    ALTER TABLE "TaxDeduction" ADD CONSTRAINT "TaxDeduction_invoiceId_fkey"
      FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
