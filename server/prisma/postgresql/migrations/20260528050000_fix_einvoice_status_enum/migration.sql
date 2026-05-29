-- Répare les environnements où l'enum EInvoiceStatus a été créé partiellement.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EInvoiceStatus') THEN
    CREATE TYPE "EInvoiceStatus" AS ENUM (
      'NOT_READY',
      'READY',
      'XML_GENERATED',
      'PENDING_PA',
      'SENT',
      'DELIVERED',
      'ERROR'
    );
  END IF;
END
$$;

ALTER TYPE "EInvoiceStatus" ADD VALUE IF NOT EXISTS 'NOT_READY';
ALTER TYPE "EInvoiceStatus" ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE "EInvoiceStatus" ADD VALUE IF NOT EXISTS 'XML_GENERATED';
ALTER TYPE "EInvoiceStatus" ADD VALUE IF NOT EXISTS 'PENDING_PA';
ALTER TYPE "EInvoiceStatus" ADD VALUE IF NOT EXISTS 'SENT';
ALTER TYPE "EInvoiceStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "EInvoiceStatus" ADD VALUE IF NOT EXISTS 'ERROR';
