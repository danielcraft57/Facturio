import { IsDateString, IsOptional } from 'class-validator';

export class ReceivablesQueryDto {
	@IsOptional()
	@IsDateString()
	start?: string;

	@IsOptional()
	@IsDateString()
	end?: string;
}
