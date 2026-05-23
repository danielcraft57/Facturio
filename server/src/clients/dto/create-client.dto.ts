import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ClientStatus } from '@prisma/client';

export class CreateClientDto {
	@IsString()
	name!: string;

	@IsEmail()
	email!: string;

	@IsOptional()
	@IsString()
	@MaxLength(32)
	phone?: string | null;

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
	@Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') || null : value))
	siren?: string | null;

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

	@IsOptional()
	@IsEnum(ClientStatus)
	status?: ClientStatus;
}


