import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAvoirLineDto } from './create-avoir-line.dto';

export const AVOIR_STATUS_VALUES = ['DRAFT', 'SENT', 'APPLIED', 'CANCELLED'] as const;
export type AvoirStatusLiteral = typeof AVOIR_STATUS_VALUES[number];

export class CreateAvoirDto {
	@IsOptional()
	@IsString()
	number?: string;

	@IsString()
	clientId!: string;

	@IsOptional()
	@IsString()
	invoiceId?: string;

	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsEnum(AVOIR_STATUS_VALUES)
	status?: AvoirStatusLiteral;

	@IsOptional()
	@IsString()
	currency?: string;

	@IsOptional()
	@IsString()
	memo?: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateAvoirLineDto)
	lines!: CreateAvoirLineDto[];
}

