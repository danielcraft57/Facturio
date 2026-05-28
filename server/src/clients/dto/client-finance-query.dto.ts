import { IsDateString, IsOptional } from 'class-validator';

export class ClientFinanceQueryDto {
	@IsOptional()
	@IsDateString()
	start?: string;

	@IsOptional()
	@IsDateString()
	end?: string;
}
