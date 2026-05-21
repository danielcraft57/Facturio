import { IsArray, IsBoolean, IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
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

	@IsOptional()
	@IsInt()
	clientId?: number;

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

	/** Facture déjà réglée sur un autre site / moyen externe (statut PAID, solde 0). */
	@IsOptional()
	@IsBoolean()
	paidExternally?: boolean;

	@IsOptional()
	@IsDateString()
	externalPaymentDate?: string;

	@IsOptional()
	@IsString()
	externalPaymentMethod?: string;

	/** Email client : crée la fiche si absente, ou met à jour l’email si clientId fourni. */
	@IsOptional()
	@IsEmail()
	clientEmail?: string;

	/** Nom pour une nouvelle fiche client (si clientEmail sans clientId). */
	@IsOptional()
	@IsString()
	clientName?: string;
}


