import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO pour le calcul de cotisation URSSAF
 * 
 * @example
 * {
 *   "organizationId": 1,
 *   "periodStart": "2024-01-01",
 *   "periodEnd": "2024-01-31",
 *   "period": "2024-M01" // Optionnel
 * }
 */
export class CalculateContributionDto {
	/** ID de l'organisation (optionnel si injecté via contexte) */
	@IsNotEmpty()
	@IsNumber()
	@Transform(({ value }) => parseInt(value))
	organizationId!: number;

	/** Date de début de période (format ISO 8601) */
	@IsNotEmpty()
	@IsDateString()
	periodStart!: string;

	/** Date de fin de période (format ISO 8601) */
	@IsNotEmpty()
	@IsDateString()
	periodEnd!: string;

	/** Période formatée (optionnel) : "YYYY-MNN" (mensuel) ou "YYYY-QN" (trimestriel) */
	@IsOptional()
	@IsString()
	period?: string;
}

