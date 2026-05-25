import { IsArray, IsString } from 'class-validator';

export class UpdateOrganizationCatalogDto {
	@IsArray()
	@IsString({ each: true })
	technologyIds!: string[];
}
