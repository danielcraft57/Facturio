import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO de création d'une caisse.
 */
export class CreateCashRegisterDto {
	@IsString()
	@MinLength(1)
	name!: string;

	@IsOptional()
	@IsString()
	currency?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => (value == null ? undefined : parseFloat(value)))
	openingBalance?: number;

	@IsOptional()
	@IsString()
	notes?: string;
}

/**
 * DTO d'un mouvement de caisse.
 */
export class CreateCashMovementDto {
	@IsEnum(['IN', 'OUT', 'ADJUSTMENT'])
	type!: 'IN' | 'OUT' | 'ADJUSTMENT';

	@IsNumber()
	@Min(0.01)
	@Transform(({ value }) => parseFloat(value))
	amount!: number;

	@IsString()
	@MinLength(1)
	label!: string;

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	reference?: string;

	@IsOptional()
	@IsString()
	notes?: string;

	@IsOptional()
	@IsString()
	date?: string;
}
