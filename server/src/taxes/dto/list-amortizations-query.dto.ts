import { IsOptional, IsString } from 'class-validator';

/**
 * DTO pour les query parameters de liste d'amortissements
 * 
 * Tous les champs sont optionnels. La transformation en nombres
 * est gérée manuellement dans le contrôleur pour éviter les
 * problèmes de validation avec les query params vides.
 */
export class ListAmortizationsQueryDto {
	@IsOptional()
	@IsString()
	year?: string;
}

