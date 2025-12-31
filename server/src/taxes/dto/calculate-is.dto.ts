import { IsNotEmpty, IsNumber, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO pour le calcul de l'Impôt sur les Sociétés (IS)
 * 
 * @example
 * {
 *   "year": 2024,
 *   "revenue": 100000,
 *   "expenses": 60000,
 *   "isPME": true,
 *   "capitalHeldByIndividuals": 80
 * }
 */
export class CalculateIsDto {
	/** Année fiscale */
	@IsNotEmpty()
	@IsInt()
	@Transform(({ value }) => parseInt(value))
	year!: number;

	/** Chiffre d'affaires (revenus) */
	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	revenue!: number;

	/** Charges et dépenses déductibles */
	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	expenses!: number;

	/** Réintégrations fiscales (charges non déductibles) */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	fiscalReintegrations?: number;

	/** Déductions fiscales supplémentaires */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	fiscalDeductions?: number;

	/** Amortissements déductibles */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	amortizations?: number;

	/** Provisions déductibles */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	provisions?: number;

	/** Est une PME (CA < 10M€) */
	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true)
	isPME?: boolean;

	/** Pourcentage du capital détenu par des personnes physiques (pour réduction PME) */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(100)
	@Transform(({ value }) => parseFloat(value))
	capitalHeldByIndividuals?: number;

	/** Report de déficit des années précédentes */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	lossCarryForward?: number;
}

