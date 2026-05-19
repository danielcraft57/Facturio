import { IsIn, IsOptional } from 'class-validator';

/** Rythme de facturation Stripe (abonnement) ou paiement unique 12 mois. */
export type SaasCheckoutSchedule = 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'YEARLY_UPFRONT';

export class CreateCheckoutDto {
	@IsIn(['PRO', 'PRO_EFACTURE'])
	plan!: 'PRO' | 'PRO_EFACTURE';

	@IsOptional()
	@IsIn(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'YEARLY_UPFRONT'])
	billingSchedule?: SaasCheckoutSchedule;
}
