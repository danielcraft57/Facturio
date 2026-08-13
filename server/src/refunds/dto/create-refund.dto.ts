import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateRefundDto {
	@IsNumber()
	@Min(0.01)
	@Max(1_000_000)
	amount!: number;

	@IsOptional()
	@IsNumber()
	paymentId?: number;

	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsString()
	@MaxLength(64)
	method?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	reason?: string;

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	notes?: string;

	/** Tente un remboursement Stripe si le paiement source est `stripe:{paymentIntentId}`. */
	@IsOptional()
	@IsBoolean()
	refundViaStripe?: boolean;
}

export class CancelDepositDto {
	@IsOptional()
	@IsString()
	@MaxLength(500)
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
