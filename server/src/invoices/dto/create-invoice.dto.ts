import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
// On évite de dépendre des enums Prisma côté DTO pour rester stable
export const INVOICE_STATUS_VALUES = ['DRAFT','SENT','PAID','OVERDUE','CANCELLED'] as const;
export type InvoiceStatusLiteral = typeof INVOICE_STATUS_VALUES[number];

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
	@IsEnum(INVOICE_STATUS_VALUES)
	status?: InvoiceStatusLiteral;

	@IsOptional()
	@IsString()
	currency?: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => InvoiceLineDto)
	lines!: InvoiceLineDto[];
}


