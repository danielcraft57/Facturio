import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO pour la création d'une déclaration URSSAF
 * 
 * @example
 * {
 *   "organizationId": 1,
 *   "period": "2024-M01" // Mensuel
 * }
 * 
 * @example
 * {
 *   "organizationId": 1,
 *   "period": "2024-Q1" // Trimestriel
 * }
 */
export class CreateUrssafFilingDto {
	/** ID de l'organisation (optionnel si injecté via contexte) */
	@IsNotEmpty()
	@IsNumber()
	@Transform(({ value }) => parseInt(value))
	organizationId: number;

	/** 
	 * Période de déclaration
	 * Format mensuel : "YYYY-MNN" (ex: "2024-M01", "2024-M12")
	 * Format trimestriel : "YYYY-QN" (ex: "2024-Q1", "2024-Q4")
	 */
	@IsNotEmpty()
	@IsString()
	period: string;
}

