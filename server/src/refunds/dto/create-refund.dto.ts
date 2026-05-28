import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRefundDto {
	@IsNumber()
	@Min(0.01)
	amount!: number;

	@IsOptional()
	@IsNumber()
	paymentId?: number;

	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsString()
	method?: string;

	@IsOptional()
	@IsString()
	reason?: string;

	@IsOptional()
	@IsString()
	notes?: string;

	/** Tente un remboursement Stripe si le paiement source est `stripe:{paymentIntentId}`. */
	@IsOptional()
	@IsBoolean()
	refundViaStripe?: boolean;
}

export class CancelDepositDto {
	@IsOptional()
	@IsString()
	reason?: string;

	@IsOptional()
	@IsBoolean()
	refundViaStripe?: boolean;

	/**
	 * Annulation par avoir uniquement (crédit client) : pas de remboursement (pas de sortie banque).
	 * L'avoir reste disponible pour être imputé sur une prochaine facture.
	 */
	@IsOptional()
	@IsBoolean()
	creditOnly?: boolean;
}
