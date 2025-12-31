import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO pour la création d'un amortissement
 * 
 * @example
 * {
 *   "assetName": "Ordinateur portable",
 *   "purchaseDate": "2024-01-15",
 *   "purchaseAmount": 1500,
 *   "method": "LINEAR",
 *   "duration": 3
 * }
 */
export class CreateAmortizationDto {
	/** Nom du bien */
	@IsNotEmpty()
	@IsString()
	assetName!: string;

	/** Description (optionnel) */
	@IsOptional()
	@IsString()
	assetDescription?: string;

	/** Date d'achat */
	@IsNotEmpty()
	@IsDateString()
	purchaseDate!: string;

	/** Montant d'achat (en euros) */
	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	purchaseAmount!: number;

	/** Valeur résiduelle (optionnel, défaut: 0) */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	residualValue?: number;

	/** Méthode d'amortissement */
	@IsNotEmpty()
	@IsEnum(['LINEAR', 'DECLINING', 'EXCEPTIONAL'])
	method!: 'LINEAR' | 'DECLINING' | 'EXCEPTIONAL';

	/** Durée en années */
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Transform(({ value }) => parseInt(value))
	duration!: number;

	/** Coefficient pour dégressif (1.25 ou 1.75, optionnel) */
	@IsOptional()
	@IsNumber()
	@Transform(({ value }) => parseFloat(value))
	coefficient?: number;
}

