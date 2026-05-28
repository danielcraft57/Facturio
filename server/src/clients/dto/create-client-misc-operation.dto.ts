import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export const CLIENT_MISC_KINDS = ['adjustment', 'goodwill', 'fee', 'other'] as const;
export type ClientMiscKind = (typeof CLIENT_MISC_KINDS)[number];

export class CreateClientMiscOperationDto {
	@IsString()
	label!: string;

	/** Montant TTC (positif = crédit client / avoir). */
	@IsNumber()
	@Min(0.01)
	amountTtc!: number;

	@IsOptional()
	@IsIn(CLIENT_MISC_KINDS)
	kind?: ClientMiscKind;

	@IsOptional()
	@IsString()
	notes?: string;
}
