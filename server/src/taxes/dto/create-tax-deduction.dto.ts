import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO pour la création d'une déduction fiscale
 * 
 * @example
 * {
 *   "category": "EXPENSE",
 *   "name": "Frais de déplacement",
 *   "amount": 500,
 *   "year": 2024,
 *   "invoiceId": 1
 * }
 */
export class CreateTaxDeductionDto {
	/** Catégorie de déduction */
	@IsNotEmpty()
	@IsEnum(['EXPENSE', 'AMORTIZATION', 'PROVISION', 'INTEREST', 'CHARITY', 'OTHER'])
	category!: 'EXPENSE' | 'AMORTIZATION' | 'PROVISION' | 'INTEREST' | 'CHARITY' | 'OTHER';

	/** Nom de la déduction */
	@IsNotEmpty()
	@IsString()
	name!: string;

	/** Description (optionnel) */
	@IsOptional()
	@IsString()
	description?: string;

	/** Montant de la déduction (en euros) */
	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	amount!: number;

	/** Année fiscale */
	@IsNotEmpty()
	@IsInt()
	@Transform(({ value }) => parseInt(value))
	year!: number;

	/** Taux de déductibilité (0 à 1, défaut: 1.0 = 100%) */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(1)
	@Transform(({ value }) => parseFloat(value))
	deductibleRate?: number;

	/** ID de la facture associée (optionnel) */
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => parseInt(value))
	invoiceId?: string;

	/** ID du document justificatif (optionnel) */
	@IsOptional()
	@IsInt()
	@Transform(({ value }) => parseInt(value))
	documentId?: number;

	/** Notes (optionnel) */
	@IsOptional()
	@IsString()
	notes?: string;
}

