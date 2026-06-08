import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProductDeliverableDto {
	@IsString()
	label!: string;

	@IsOptional()
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return undefined;
		const num = Number(value);
		return Number.isNaN(num) ? undefined : num;
	})
	@IsNumber()
	@Min(0)
	amount?: number;

	@IsOptional()
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === '') return undefined;
		const num = Number(value);
		return Number.isNaN(num) ? undefined : num;
	})
	@IsNumber()
	@Min(0)
	hours?: number;
}
