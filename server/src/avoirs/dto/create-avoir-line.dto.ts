import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAvoirLineDto {
	@IsNotEmpty()
	@IsString()
	description!: string;

	@IsInt()
	@Min(1)
	quantity!: number;

	@IsNumber()
	@Min(0)
	unitPrice!: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	taxRate?: number;
}

