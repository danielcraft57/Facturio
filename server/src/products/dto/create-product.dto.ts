import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductKind } from '@prisma/client';

/**
 * DTO pour la création d'un produit
 */
export class CreateProductDto {
	@IsNotEmpty()
	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	sku?: string | null;

	@IsOptional()
	@IsEnum(ProductKind)
	kind?: ProductKind;

	@IsOptional()
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return null;
		const num = Number(value);
		return isNaN(num) ? null : num;
	})
	@IsNumber({}, { message: 'unitPrice must be a number' })
	@Min(0, { message: 'unitPrice must be positive' })
	unitPrice?: number | null;

	@IsOptional()
	@Transform(({ value }) => (value === undefined || value === null || value === '' ? undefined : parseInt(value, 10)))
	@IsInt()
	defaultTaxRateId?: number | null;
}

