import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboard: DashboardService) {}

	@Get('stats')
	getStats(
		@Query('startDate') startDate: string | undefined,
		@Query('endDate') endDate: string | undefined,
		@CurrentUser() user: any
	) {
		return this.dashboard.getStats(startDate, endDate, user.organizationId);
	}
}




