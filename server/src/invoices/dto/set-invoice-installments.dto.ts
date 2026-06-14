import { Type } from 'class-transformer';
import {
	IsArray,
	IsDateString,
	IsInt,
	IsNumber,
	IsOptional,
	Max,
	Min,
	ValidateNested,
} from 'class-validator';

/** Une échéance du plan de paiement. */
export class InvoiceInstallmentRowDto {
	/** Montant TTC de l'échéance (€). */
	@IsNumber()
	@Min(0.01)
	amount!: number;

	/** Date d'échéance (ISO 8601). */
	@IsDateString()
	dueDate!: string;
}

/** Corps pour définir l'échéancier d'une facture. */
export class SetInvoiceInstallmentsDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => InvoiceInstallmentRowDto)
	installments!: InvoiceInstallmentRowDto[];
}

/** Aide : génération d'échéances égales. */
export class PreviewEqualInstallmentsDto {
	@IsNumber()
	@Min(0.01)
	total!: number;

	@IsInt()
	@Min(2)
	@Max(24)
	count!: number;

	@IsDateString()
	firstDueDate!: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(12)
	intervalMonths?: number;
}
