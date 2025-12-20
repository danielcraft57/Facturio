import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboard: DashboardService) {}

	@Get('stats')
	getStats(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
		return this.dashboard.getStats(startDate, endDate);
	}
}




