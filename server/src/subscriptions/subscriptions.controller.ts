import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreatePlanDto, CreateSubscriptionDto, SubscriptionsService, UpdatePlanDto, UpdateSubscriptionDto } from './subscriptions.service';

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
	create(@Body() data: CreateSubscriptionDto) {
		return this.subs.createSubscription(data);
	}

	@Get()
	list() {
		return this.subs.listSubscriptions();
	}

	@Get(':id')
	get(@Param('id', ParseIntPipe) id: number) {
		return this.subs.getSubscription(id);
	}

	@Patch(':id')
	update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateSubscriptionDto) {
		return this.subs.updateSubscription(id, data);
	}

	@Post(':id/cancel-at-period-end')
	cancelAtPeriodEnd(@Param('id', ParseIntPipe) id: number) {
		return this.subs.cancelAtPeriodEnd(id);
	}

	@Post(':id/cancel-now')
	cancelNow(@Param('id', ParseIntPipe) id: number) {
		return this.subs.cancelNow(id);
	}
}


