import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '@prisma/client';

class InvoiceLineDto {
	@IsString()
	description!: string;

	@IsInt()
	@Min(1)
	quantity!: number;

	@IsNumber()
	unitPrice!: number;

	@IsOptional()
	@IsNumber()
	taxRate?: number;
}

export class CreateInvoiceDto {
	@IsOptional()
	@IsString()
	number?: string;

	@IsInt()
	clientId!: number;

	@IsOptional()
	@IsDateString()
	dueDate?: string;

	@IsOptional()
	@IsEnum(InvoiceStatus)
	status?: InvoiceStatus;

	@IsOptional()
	@IsString()
	currency?: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => InvoiceLineDto)
	lines!: InvoiceLineDto[];
}


