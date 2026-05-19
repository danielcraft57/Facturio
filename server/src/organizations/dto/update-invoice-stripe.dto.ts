import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}
