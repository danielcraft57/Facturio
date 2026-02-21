import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreatePlanDto, CreateSubscriptionDto, SubscriptionsService, UpdatePlanDto, UpdateSubscriptionDto } from './subscriptions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
	constructor(private readonly subs: SubscriptionsService) {}

	// Plans
	@Post('plans')
	createPlan(@Body() data: CreatePlanDto) {
		return this.subs.createPlan(data);
	}

	@Get('plans')
	listPlans() {
		return this.subs.listPlans();
	}

	@Get('plans/:id')
	getPlan(@Param('id', ParseIntPipe) id: number) {
		return this.subs.getPlan(id);
	}

	@Patch('plans/:id')
	updatePlan(@Param('id', ParseIntPipe) id: number, @Body() data: UpdatePlanDto) {
		return this.subs.updatePlan(id, data);
	}

	@Delete('plans/:id')
	deletePlan(@Param('id', ParseIntPipe) id: number) {
		return this.subs.deletePlan(id);
	}

	// Subscriptions
	@Post()
	create(@Body() data: CreateSubscriptionDto, @CurrentUser() user: any) {
		return this.subs.createSubscription(data, user.organizationId);
	}

	@Get()
	list(@CurrentUser() user: any) {
		return this.subs.listSubscriptions(user.organizationId);
	}

	@Get(':id')
	get(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.subs.getSubscription(id, user.organizationId);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateSubscriptionDto, @CurrentUser() user: any) {
		return this.subs.updateSubscription(id, data, user.organizationId);
	}

	@Post(':id/cancel-at-period-end')
	cancelAtPeriodEnd(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.subs.cancelAtPeriodEnd(id, user.organizationId);
	}

	@Post(':id/cancel-now')
	cancelNow(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
		return this.subs.cancelNow(id, user.organizationId);
	}
}


