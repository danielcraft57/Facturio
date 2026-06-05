import { IsArray, IsOptional, IsString } from 'class-validator';

export class ReceivablesRemindDto {
	/** Si vide : toutes les factures en retard éligibles (cooldown 7 j). */
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	invoiceIds?: string[];
}
