import { IsArray, IsOptional, IsString } from 'class-validator';

class TechStackLayerDto {
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	languages?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	frontend?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	backend?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	cms?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	databases?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	devops?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	ai?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	mobile?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	security?: string[];
}

/** Assemblage techno par couche (aligné tech-stack-choices.json). */
export class TechStackDto extends TechStackLayerDto {}
