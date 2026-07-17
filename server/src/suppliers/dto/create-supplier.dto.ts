import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO de création d'un fournisseur.
 */
export class CreateSupplierDto {
	/** Raison sociale / nom commercial */
	@IsString()
	@MinLength(1)
	name!: string;

	/** Dénomination légale */
	@IsOptional()
	@IsString()
	legalName?: string;

	@IsOptional()
	@IsString()
	siret?: string;

	@IsOptional()
	@IsString()
	vatNumber?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsString()
	address?: string;

	@IsOptional()
	@IsString()
	city?: string;

	@IsOptional()
	@IsString()
	zipCode?: string;

	@IsOptional()
	@IsString()
	country?: string;

	/** Délai de paiement en jours */
	@IsOptional()
	@IsInt()
	@Min(0)
	@Transform(({ value }) => (value == null ? undefined : parseInt(value, 10)))
	paymentTermsDays?: number;

	@IsOptional()
	@IsString()
	iban?: string;

	@IsOptional()
	@IsString()
	bic?: string;

	@IsOptional()
	@IsString()
	notes?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
