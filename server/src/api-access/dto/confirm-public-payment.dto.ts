import { IsString, MinLength } from 'class-validator';

/**
 * Corps pour confirmer un PaymentIntent Stripe après encaissement côté client.
 */
export class ConfirmPublicPaymentDto {
	/**
	 * Identifiant Stripe du PaymentIntent (ex. `pi_…`).
	 */
	@IsString()
	@MinLength(3)
	paymentIntentId!: string;
}
