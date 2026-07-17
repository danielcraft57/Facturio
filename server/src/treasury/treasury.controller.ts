import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountingPlanGuard } from '../billing/guards/accounting-plan.guard';
import { TreasuryService } from './treasury.service';

/**
 * API trésorerie / prévision de cashflow (plan Pro+ compta).
 */
@UseGuards(AccountingPlanGuard)
@Controller('treasury')
export class TreasuryController {
	constructor(private readonly treasury: TreasuryService) {}

	/**
	 * Prévision de trésorerie sur N jours.
	 * @param user - Utilisateur authentifié
	 * @param days - Horizon (défaut 90)
	 */
	@Get('forecast')
	forecast(
		@CurrentUser() user: { organizationId?: number },
		@Query('days') days?: string,
	) {
		const n = days ? parseInt(days, 10) : 90;
		return this.treasury.getForecast(user.organizationId, Number.isFinite(n) ? n : 90);
	}
}
