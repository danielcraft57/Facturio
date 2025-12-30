import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingInterval, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Données de création de plan d'abonnement
 */
export interface CreatePlanDto {
	/** ID du produit associé */
	productId: number;
	/** Nom du plan */
	name: string;
	/** Montant de l'abonnement */
	amount: number;
	/** Devise (défaut: EUR) */
	currency?: string;
	/** Intervalle de facturation (MONTHLY, YEARLY) */
	interval: BillingInterval;
	/** Jours d'essai gratuit (optionnel) */
	trialDays?: number | null;
	/** Facturation à l'usage (métrique) */
	metered?: boolean;
}

/**
 * Données de mise à jour de plan
 */
export interface UpdatePlanDto {
	/** Nom du plan */
	name?: string;
	/** Montant */
	amount?: number;
	/** Devise */
	currency?: string;
	/** Intervalle */
	interval?: BillingInterval;
	/** Jours d'essai */
	trialDays?: number | null;
	/** Facturation à l'usage */
	metered?: boolean;
}

/**
 * Données de création d'abonnement
 */
export interface CreateSubscriptionDto {
	/** ID du client */
	clientId: number;
	/** ID du plan */
	planId: number;
	/** Quantité (optionnel, défaut: 1) */
	quantity?: number;
	/** Date de début (optionnel, défaut: maintenant) */
	startDate?: string | Date;
}

/**
 * Service de gestion des abonnements
 * 
 * Gère :
 * - Les plans d'abonnement (création, mise à jour)
 * - Les abonnements clients (création, activation, annulation)
 * - La facturation récurrente
 * - Les périodes d'essai
 * 
 * @see SubscriptionsController pour les endpoints API
 */

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


