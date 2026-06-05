import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreatePayableDebtDto {
	@IsInt()
	creditorId!: number;

	@IsString()
	@MinLength(1)
	label!: string;

	@IsNumber()
	@Min(0.01)
	totalAmount!: number;

	@IsOptional()
	@IsDateString()
	dueDate?: string;

	@IsOptional()
	@IsString()
	notes?: string;
}
