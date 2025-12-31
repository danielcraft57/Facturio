import { IsOptional, IsString, IsInt, IsPositive, Min, Max, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO pour les query parameters de liste de déductions fiscales
 * 
 * Tous les champs sont optionnels. La transformation en nombres
 * est gérée automatiquement avec @Transform pour éviter les
 * problèmes de validation avec les query params vides.
 */
export class ListTaxDeductionsQueryDto {
	@IsOptional()
	@Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : parseInt(value, 10))
	@IsInt()
	@IsPositive()
	page?: number = 1;

	@IsOptional()
	@Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : parseInt(value, 10))
	@IsInt()
	@Min(1)
	@Max(100)
	pageSize?: number = 20;

	@IsOptional()
	@Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : parseInt(value, 10))
	@IsInt()
	year?: number;

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	status?: string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	sortBy?: string;

	@IsOptional()
	@IsIn(['asc', 'desc'])
	order?: 'asc' | 'desc' = 'desc';
}

