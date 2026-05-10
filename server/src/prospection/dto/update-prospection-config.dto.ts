import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateProspectionConfigDto {
	/** Ex: https://prospectlab.danielcraft.fr */
	@IsOptional()
	@IsString()
	@IsUrl({ require_tld: false })
	apiUrl?: string;

	/** Token ProspectLab (Bearer) */
	@IsOptional()
	@IsString()
	@MinLength(10)
	apiKey?: string;
}

