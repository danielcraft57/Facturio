import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePayableDebtPaymentDto {
	@IsNumber()
	@Min(0.01)
	amount!: number;

	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsString()
	method?: string;

	@IsOptional()
	@IsString()
	notes?: string;
}
