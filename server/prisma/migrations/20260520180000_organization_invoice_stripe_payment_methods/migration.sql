-- Moyens de paiement Stripe affichés sur la page de paiement facture (JSON array)
ALTER TABLE "Organization" ADD COLUMN "invoiceStripePaymentMethods" TEXT;
