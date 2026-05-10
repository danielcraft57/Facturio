import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

function emptyToUndefined(v: unknown): unknown {
	if (v === '' || v === null) return undefined;
	return v;
}

export class UpdateProspectionConfigDto {
	/** Ex: https://prospectlab.danielcraft.fr */
	@IsOptional()
	@Transform(({ value }) => emptyToUndefined(value))
	@IsString()
	@IsUrl({ require_tld: false })
	apiUrl?: string;

	/** Token ProspectLab (Bearer) */
	@IsOptional()
	@Transform(({ value }) => emptyToUndefined(value))
	@IsString()
	@MinLength(10)
	apiKey?: string;
}

