import {
	IsArray,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
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

	@IsOptional()
	@IsString()
	purpose?: string | null;

	@IsOptional()
	@IsString()
	category?: string | null;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return undefined;
		if (Array.isArray(value)) return value;
		if (typeof value === 'string') {
			return value.split(',').map((s: string) => s.trim()).filter(Boolean);
		}
		return value;
	})
	languages?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return undefined;
		if (Array.isArray(value)) return value;
		if (typeof value === 'string') {
			return value.split(/[\r\n,]+/).map((s: string) => s.trim()).filter(Boolean);
		}
		return value;
	})
	details?: string[];

	@IsOptional()
	@Transform(({ value }) => (value === undefined || value === null || value === '' ? undefined : parseInt(value, 10)))
	@IsInt()
	@Min(0)
	estimatedHours?: number | null;

	@IsOptional()
	@IsString()
	description?: string | null;

	@IsOptional()
	@IsString()
	visualType?: string | null;

	@IsOptional()
	@IsString()
	iconName?: string | null;

	@IsOptional()
	@IsString()
	imageData?: string | null;
}
