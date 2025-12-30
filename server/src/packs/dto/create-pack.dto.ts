import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO pour la création d'un pack
 */
export class CreatePackDto {
	@IsNotEmpty()
	@IsString()
	name!: string;

	@IsNotEmpty()
	@IsString()
	type!: string;

	@IsNotEmpty()
	@IsString()
	description!: string;

	@IsNotEmpty()
	@IsString()
	details!: string;

	@IsNotEmpty()
	@IsArray()
	@IsString({ each: true })
	products!: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	features?: string[];

	@IsOptional()
	@IsInt()
	@Min(0)
	deliveryTime?: number;
}

