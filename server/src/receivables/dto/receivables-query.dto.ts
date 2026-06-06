import { IsDateString, IsIn, IsOptional } from 'class-validator';
import type { ReceivableDocumentKind } from '../receivable-document-kind.util';

const KINDS: ReceivableDocumentKind[] = ['standard', 'deposit', 'remainder'];

export class ReceivablesQueryDto {
	@IsOptional()
	@IsDateString()
	start?: string;

	@IsOptional()
	@IsDateString()
	end?: string;

	@IsOptional()
	@IsIn(KINDS)
	kind?: ReceivableDocumentKind;
}
