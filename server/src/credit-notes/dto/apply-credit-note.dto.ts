import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class ApplyCreditNoteDto {
	@IsInt()
	@IsNotEmpty()
	invoiceId!: number;

	@IsNumber()
	@Min(0.01)
	amount!: number;
}

