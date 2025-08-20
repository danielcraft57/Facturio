import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingInterval, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePlanDto {
	productId: number;
	name: string;
	amount: number;
	currency?: string;
	interval: BillingInterval;
	trialDays?: number | null;
	metered?: boolean;
}

export interface UpdatePlanDto {
	name?: string;
	amount?: number;
	currency?: string;
	interval?: BillingInterval;
	trialDays?: number | null;
	metered?: boolean;
}

export interface CreateSubscriptionDto {
	clientId: number;
	planId: number;
	quantity?: number;
	startDate?: string | Date;
}

export interface UpdateSubscriptionDto {
	planId?: number;
	quantity?: number;
	status?: SubscriptionStatus;
	cancelAtPeriodEnd?: boolean;
}

@Injectable()
export class SubscriptionsService {
	constructor(private readonly prisma: PrismaService) {}

	// Plans
	createPlan(data: CreatePlanDto) {
		return this.prisma.plan.create({ data });
	}

	listPlans() {
		return this.prisma.plan.findMany({ orderBy: { createdAt: 'desc' }, include: { product: true } });
	}

	async getPlan(id: number) {
		const plan = await this.prisma.plan.findUnique({ where: { id }, include: { product: true } });
		if (!plan) throw new NotFoundException('Plan introuvable');
		return plan;
	}

	updatePlan(id: number, data: UpdatePlanDto) {
		return this.prisma.plan.update({ where: { id }, data, include: { product: true } });
	}

	async deletePlan(id: number) {
		await this.getPlan(id);
		await this.prisma.plan.delete({ where: { id } });
		return { success: true };
	}

	// Subscriptions
	async createSubscription(data: CreateSubscriptionDto) {
		const start = data.startDate ? new Date(data.startDate) : new Date();
		const plan = await this.getPlan(data.planId);
		const periodStart = start;
		const periodEnd = new Date(periodStart);
		if (plan.interval === BillingInterval.MONTH) {
			periodEnd.setMonth(periodEnd.getMonth() + 1);
		} else {
			periodEnd.setFullYear(periodEnd.getFullYear() + 1);
		}
		return this.prisma.subscription.create({
			data: {
				clientId: data.clientId,
				planId: data.planId,
				quantity: data.quantity ?? 1,
				currentPeriodStart: periodStart,
				currentPeriodEnd: periodEnd
			},
			include: { plan: true, client: true }
		});
	}

	listSubscriptions() {
		return this.prisma.subscription.findMany({ orderBy: { createdAt: 'desc' }, include: { plan: true, client: true } });
	}

	async getSubscription(id: number) {
		const sub = await this.prisma.subscription.findUnique({ where: { id }, include: { plan: true, client: true } });
		if (!sub) throw new NotFoundException('Abonnement introuvable');
		return sub;
	}

	async updateSubscription(id: number, data: UpdateSubscriptionDto) {
		await this.getSubscription(id);
		return this.prisma.subscription.update({ where: { id }, data, include: { plan: true, client: true } });
	}

	async cancelAtPeriodEnd(id: number) {
		return this.prisma.subscription.update({ where: { id }, data: { cancelAtPeriodEnd: true } });
	}

	async cancelNow(id: number) {
		return this.prisma.subscription.update({ where: { id }, data: { status: SubscriptionStatus.CANCELED, canceledAt: new Date() } });
	}
}


