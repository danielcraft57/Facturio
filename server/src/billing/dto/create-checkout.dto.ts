import { IsIn } from 'class-validator';

export class CreateCheckoutDto {
	@IsIn(['PRO', 'PRO_EFACTURE'])
	plan!: 'PRO' | 'PRO_EFACTURE';
}
