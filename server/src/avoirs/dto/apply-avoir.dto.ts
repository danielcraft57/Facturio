import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ApplyAvoirDto {
	@IsString()
	@IsNotEmpty()
	invoiceId!: string;

	@IsNumber()
	@Min(0.01)
	amount!: number;
}

