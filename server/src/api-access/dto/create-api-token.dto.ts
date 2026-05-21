import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { API_ACCESS_SCOPES } from '../api-access-permissions';

export class CreateApiTokenDto {
	@IsString()
	@MinLength(1)
	@MaxLength(80)
	name!: string;

	@IsArray()
	@ArrayMinSize(1)
	@IsIn(API_ACCESS_SCOPES as unknown as string[], { each: true })
	permissions!: string[];
}

export class UpdateApiTokenDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(80)
	name?: string;

	@IsOptional()
	@IsArray()
	@IsIn(API_ACCESS_SCOPES as unknown as string[], { each: true })
	permissions?: string[];
}
