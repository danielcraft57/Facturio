import {
	IsArray,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductKind } from '@prisma/client';
import { TechStackDto } from './tech-stack.dto';
import { ProductDeliverableDto } from './product-deliverable.dto';
import {
	normalizeProductSku,
	PRODUCT_SKU_FORMAT_HINT,
	PRODUCT_SKU_MAX_LENGTH,
	PRODUCT_SKU_PATTERN,
} from '../product-sku.util';
import { normalizeDetailsInput } from '../product-payload-normalize.util';

/**
 * DTO pour la création d'un produit
 */
export class CreateProductDto {
	@IsNotEmpty()
	@IsString()
	name!: string;

	@IsNotEmpty({ message: 'sku is required' })
	@IsString()
	@MinLength(5)
	@MaxLength(PRODUCT_SKU_MAX_LENGTH)
	@Matches(PRODUCT_SKU_PATTERN, { message: PRODUCT_SKU_FORMAT_HINT })
	@Transform(({ value }) => normalizeProductSku(value))
	sku!: string;

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

	/** Alias accepté : livrables (même format que details). */
	@IsOptional()
	@IsArray()
	livrables?: unknown[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ProductDeliverableDto)
	@Transform(({ value, obj }) => normalizeDetailsInput(value ?? obj.livrables))
	details?: ProductDeliverableDto[];

	/** Alias de languages (liste plate). Préférer techStack.languages. */
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	technos?: string[];

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

	@IsOptional()
	@ValidateNested()
	@Type(() => TechStackDto)
	techStack?: TechStackDto | null;
}
