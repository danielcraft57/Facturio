import { IsIn, IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListQueryDto {
	@IsOptional()
	@Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : parseInt(value, 10))
	@IsInt()
	@IsPositive()
	page?: number = 1;

	@IsOptional()
	@Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : parseInt(value, 10))
	@IsInt()
	@Min(1)
	@Max(100)
	pageSize?: number = 20;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	sortBy?: string;

	@IsOptional()
	@IsIn(['asc', 'desc'])
	order?: 'asc' | 'desc' = 'desc';
}


