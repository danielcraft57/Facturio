import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { INVOICE_STRIPE_PAYMENT_METHOD_IDS } from '../../stripe/invoice-stripe-payment-methods';

/** Clés Stripe du prestataire pour encaisser ses factures (jamais les clés plateforme .env). */
export class UpdateInvoiceStripeDto {
	@IsOptional()
	@IsString()
	@MaxLength(200)
	invoiceStripePublishableKey?: string | null;

	@IsOptional()
	@IsString()
	@MaxLength(200)
	invoiceStripeSecretKey?: string | null;

	@IsOptional()
	@IsString()
	@MaxLength(200)
	invoiceStripeWebhookSecret?: string | null;

	/** Supprime la clé secrète en base (sans envoyer de nouvelle valeur). */
	@IsOptional()
	@IsBoolean()
	clearInvoiceStripeSecretKey?: boolean;

	/** Supprime le secret webhook en base. */
	@IsOptional()
	@IsBoolean()
	clearInvoiceStripeWebhookSecret?: boolean;

	/** Moyens de paiement proposés sur la page facture (Payment Element). */
	@IsOptional()
	@IsArray()
	@IsIn([...INVOICE_STRIPE_PAYMENT_METHOD_IDS], { each: true })
	invoiceStripePaymentMethods?: string[];
}
