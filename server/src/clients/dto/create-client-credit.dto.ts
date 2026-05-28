import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateClientCreditDto {
	@IsString()
	label!: string;

	@IsNumber()
	@Min(0.01)
	amountTtc!: number;

	@IsOptional()
	@IsString()
	notes?: string;
}
