import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class ApplyAvoirDto {
	@IsInt()
	@IsNotEmpty()
	invoiceId!: number;

	@IsNumber()
	@Min(0.01)
	amount!: number;
}

