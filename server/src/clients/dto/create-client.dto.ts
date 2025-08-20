import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClientDto {
	@IsString()
	name!: string;

	@IsEmail()
	email!: string;

	@IsOptional()
	@IsString()
	address?: string | null;

	@IsOptional()
	@IsBoolean()
	isCompany?: boolean;

	@IsOptional()
	@IsString()
	companyName?: string | null;

	@IsOptional()
	@IsString()
	vatNumber?: string | null;

	@IsOptional()
	@IsBoolean()
	isVatExempt?: boolean;

	@IsOptional()
	@Transform(({ value }) => (value === undefined || value === null || value === '' ? undefined : parseInt(value, 10)))
	@IsInt()
	taxRateOverrideId?: number | null;

	@IsOptional()
	@IsString()
	@Length(2, 2)
	countryCode?: string | null;
}


