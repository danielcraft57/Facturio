import { IsOptional, IsString, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Types d'activité URSSAF
 */
export enum UrssafActivity {
	/** Vente de marchandises (taux: 12,8% ou 1% micro-fiscal) */
	VENTE = 'VENTE',
	/** Prestations de services BIC (taux: 22% ou 1,7% micro-fiscal) */
	SERVICE_BIC = 'SERVICE_BIC',
	/** Prestations de services BNC (taux: 22% ou 2,2% micro-fiscal) */
	SERVICE_BNC = 'SERVICE_BNC',
}

/**
 * Fréquence de déclaration URSSAF
 */
export enum UrssafDeclarationFrequency {
	/** Déclaration mensuelle */
	MONTHLY = 'MONTHLY',
	/** Déclaration trimestrielle */
	QUARTERLY = 'QUARTERLY',
}

/**
 * DTO pour la mise à jour de la configuration URSSAF d'une organisation
 * 
 * Tous les champs sont optionnels. Seuls les champs fournis seront mis à jour.
 * 
 * @example
 * {
 *   "urssafActivity": "SERVICE_BIC",
 *   "urssafFiscalOption": true,
 *   "urssafDeclarationFrequency": "QUARTERLY"
 * }
 */
export class UpdateOrganizationUrssafDto {
	/** Type d'activité (vente, services BIC, services BNC) */
	@IsOptional()
	@IsEnum(UrssafActivity)
	urssafActivity?: UrssafActivity;

	/** Active l'option micro-fiscal (taux réduits) */
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true' || value === true)
	urssafFiscalOption?: boolean;

	/** Fréquence de déclaration (mensuelle ou trimestrielle) */
	@IsOptional()
	@IsEnum(UrssafDeclarationFrequency)
	urssafDeclarationFrequency?: UrssafDeclarationFrequency;

	/** Taux personnalisé en pourcentage (0-100). Si non défini, utilise les taux par défaut */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(100)
	@Transform(({ value }) => parseFloat(value))
	urssafRate?: number;

	/** Seuil de CA annuel personnalisé en euros. Si non défini, utilise les seuils par défaut */
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => parseFloat(value))
	urssafThreshold?: number;
}

