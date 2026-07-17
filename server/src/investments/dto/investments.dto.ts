import {
	IsDateString,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	Min,
	MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO création investisseur.
 */
export class CreateInvestorDto {
	@IsString()
	@MinLength(1)
	name!: string;

	@IsOptional()
	@IsString()
	email?: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsEnum(['INDIVIDUAL', 'COMPANY', 'FUND'])
	type?: 'INDIVIDUAL' | 'COMPANY' | 'FUND';

	@IsOptional()
	@IsString()
	notes?: string;
}

/**
 * DTO création investissement / apport.
 */
export class CreateInvestmentDto {
	@IsOptional()
	@IsNumber()
	@Transform(({ value }) => (value == null ? undefined : parseInt(value, 10)))
	investorId?: number;

	@IsString()
	@MinLength(1)
	label!: string;

	@IsOptional()
	@IsEnum(['CAPITAL_CONTRIBUTION', 'LOAN', 'GRANT', 'OTHER'])
	type?: 'CAPITAL_CONTRIBUTION' | 'LOAN' | 'GRANT' | 'OTHER';

	@IsNumber()
	@Min(0.01)
	@Transform(({ value }) => parseFloat(value))
	amount!: number;

	@IsDateString()
	date!: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => (value == null ? undefined : parseFloat(value)))
	ownershipPercent?: number;

	@IsOptional()
	@IsNumber()
	@Transform(({ value }) => (value == null ? undefined : parseFloat(value)))
	expectedReturnPercent?: number;

	@IsOptional()
	@IsDateString()
	maturityDate?: string;

	@IsOptional()
	@IsString()
	notes?: string;

	/** Poster une écriture comptable (101/512 ou 164/512) */
	@IsOptional()
	postAccounting?: boolean;
}
