import { IsNotEmpty, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO pour le calcul de la CFE (Cotisation Foncière des Entreprises)
 * 
 * @example
 * {
 *   "year": 2024,
 *   "propertyValue": 50000,
 *   "activity": "SERVICE",
 *   "revenue": 100000,
 *   "isFirstYear": false
 * }
 */
export class CalculateCfeDto {
	/** Année fiscale */
	@IsNotEmpty()
	@IsInt()
	@Transform(({ value }) => parseInt(value))
	year!: number;

	/** Valeur locative des biens immobiliers (en euros) */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	propertyValue?: number;

	/** Type d'activité (pour forfait si pas de valeur locative) */
	@IsOptional()
	activity?: 'SERVICE' | 'COMMERCE' | 'INDUSTRIE' | 'ARTISANAT';

	/** Chiffre d'affaires (pour forfait) */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	revenue?: number;

	/** Première année d'activité (exonération possible) */
	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true)
	isFirstYear?: boolean;

	/** Taux communal personnalisé (en %, optionnel) */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	communalRate?: number;
}

