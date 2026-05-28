import { IsArray, IsBoolean, IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { normalizeTaxRateDecimal } from '../../common/tax-rate.util';
// On évite de dépendre des enums Prisma côté DTO pour rester stable
export const INVOICE_STATUS_VALUES = ['DRAFT','SENT','PAID','OVERDUE','CANCELLED'] as const;
export type InvoiceStatusLiteral = typeof INVOICE_STATUS_VALUES[number];
export const INVOICE_OPERATION_CATEGORY_VALUES = ['GOODS', 'SERVICE', 'MIXED'] as const;
export type InvoiceOperationCategoryLiteral = typeof INVOICE_OPERATION_CATEGORY_VALUES[number];

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
	@Transform(({ value }) => normalizeTaxRateDecimal(value))
	taxRate?: number;
}

export class CreateInvoiceDto {
	@IsOptional()
	@IsString()
	number?: string;

	@IsOptional()
	@IsString()
	clientId?: string;

	@IsOptional()
	@IsDateString()
	dueDate?: string;

	/** Catégorie d'opération demandée par la réforme (biens, services, mixte). */
	@IsOptional()
	@IsEnum(INVOICE_OPERATION_CATEGORY_VALUES)
	operationCategory?: InvoiceOperationCategoryLiteral;

	/** TVA sur les débits (option activée). */
	@IsOptional()
	@IsBoolean()
	vatOnDebits?: boolean;

	/** Adresse de livraison si différente de l'adresse de facturation. */
	@IsOptional()
	@IsString()
	deliveryAddress?: string;

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

	/** Impute automatiquement les crédits client (avoirs non liés) sur la nouvelle facture. */
	@IsOptional()
	@IsBoolean()
	applyClientCredits?: boolean;
}


