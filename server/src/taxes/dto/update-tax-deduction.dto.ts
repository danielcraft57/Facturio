import { IsOptional, IsString, IsNumber, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO pour la mise à jour d'une déduction fiscale
 * 
 * Tous les champs sont optionnels.
 */
export class UpdateTaxDeductionDto {
	/** Catégorie de déduction */
	@IsOptional()
	@IsEnum(['EXPENSE', 'AMORTIZATION', 'PROVISION', 'INTEREST', 'CHARITY', 'OTHER'])
	category?: 'EXPENSE' | 'AMORTIZATION' | 'PROVISION' | 'INTEREST' | 'CHARITY' | 'OTHER';

	/** Nom */
	@IsOptional()
	@IsString()
	name?: string;

	/** Description */
	@IsOptional()
	@IsString()
	description?: string;

	/** Montant */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	amount?: number;

	/** Année fiscale */
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => parseInt(value))
	year?: number;

	/** Taux de déductibilité */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(1)
	@Transform(({ value }) => parseFloat(value))
	deductibleRate?: number;

	/** Statut */
	@IsOptional()
	@IsEnum(['PENDING', 'VALIDATED', 'REJECTED'])
	status?: 'PENDING' | 'VALIDATED' | 'REJECTED';

	/** Notes */
	@IsOptional()
	@IsString()
	notes?: string;
}

