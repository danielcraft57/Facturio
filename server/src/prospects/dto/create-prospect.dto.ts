import { IsArray, IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DecisionMakerDto } from './decision-maker.dto';

/**
 * DTO pour la création d'un prospect
 */
export class CreateProspectDto {
	@IsNotEmpty()
	@IsString()
	companyName!: string;

	@IsNotEmpty()
	@IsString()
	industry!: string;

	@IsNotEmpty()
	@IsString()
	size!: string;

	@IsOptional()
	@IsUrl()
	website?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsString()
	address?: string;

	@IsOptional()
	@IsString()
	city?: string;

	@IsNotEmpty()
	@IsString()
	country!: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	revenue?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	employees?: number;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	painPoints?: string[];

	@IsOptional()
	@IsString()
	budget?: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => DecisionMakerDto)
	decisionMaker?: DecisionMakerDto;

	@IsOptional()
	@IsString()
	source?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(100)
	score?: number;

	@IsOptional()
	@IsString()
	priority?: string;

	@IsOptional()
	@IsString()
	assignedTo?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	notes?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tags?: string[];
}

