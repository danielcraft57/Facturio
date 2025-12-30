import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * DTO pour les informations du décideur
 */
export class DecisionMakerDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	position?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsUrl()
	linkedin?: string;
}

