import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCreditNoteLineDto } from './create-credit-note-line.dto';

export const CREDIT_NOTE_STATUS_VALUES = ['DRAFT', 'SENT', 'APPLIED', 'CANCELLED'] as const;
export type CreditNoteStatusLiteral = typeof CREDIT_NOTE_STATUS_VALUES[number];

export class CreateCreditNoteDto {
	@IsOptional()
	@IsString()
	number?: string;

	@IsInt()
	clientId!: number;

	@IsInt()
	@IsOptional()
	invoiceId?: number;

	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsEnum(CREDIT_NOTE_STATUS_VALUES)
	status?: CreditNoteStatusLiteral;

	@IsOptional()
	@IsString()
	currency?: string;

	@IsOptional()
	@IsString()
	memo?: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateCreditNoteLineDto)
	lines!: CreateCreditNoteLineDto[];
}

