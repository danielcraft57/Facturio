import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { SaasBillingPlan } from '@prisma/client';
import { ConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';
import { createStripeClient } from '../stripe/stripe-client';

const PLAN_AMOUNTS_EUR: Record<'PRO' | 'PRO_EFACTURE', number> = {
	PRO: 12,
	PRO_EFACTURE: 24,
};

const PLAN_LABELS: Record<'PRO' | 'PRO_EFACTURE', string> = {
	PRO: 'Facturio Pro',
	PRO_EFACTURE: 'Facturio Pro + e-facture',
};

type PlatformStripeWebhookEvent = {
	type: string;
	data: { object: Record<string, unknown> };
};

function readStripeMetadata(obj: Record<string, unknown>): Record<string, string> {
	const raw = obj.metadata;
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
		if (value != null) out[key] = String(value);
	}
	return out;
}

@Injectable()
export class PlatformStripeService {
	private readonly logger = new Logger(PlatformStripeService.name);

	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
	) {}

	private ensurePlatformStripe() {
		const key = this.config.stripeSecretKey?.trim();
		if (!key) {
			throw new ServiceUnavailableException(
				'Paiement Facturio non configuré (STRIPE_SECRET_KEY plateforme dans .env)',
			);
		}
		return createStripeClient(key);
	}

	async createCheckoutSession(
		organizationId: number,
		userEmail: string,
		plan: 'PRO' | 'PRO_EFACTURE',
	): Promise<{ url: string }> {
		const stripe = this.ensurePlatformStripe();
		const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
		if (!org) throw new BadRequestException('Organisation introuvable');

		const baseUrl =
			process.env.FRONTEND_URL?.trim() ||
			process.env.PUBLIC_APP_URL?.trim() ||
			'http://localhost:5173';

		let customerId = org.stripeCustomerId;
		if (!customerId) {
			const customer = await stripe.customers.create({
				email: userEmail,
				name: org.legalName || org.name,
				metadata: { organizationId: String(organizationId) },
			});
			customerId = customer.id;
			await this.prisma.organization.update({
				where: { id: organizationId },
				data: { stripeCustomerId: customerId },
			});
		}

		const amountCents = PLAN_AMOUNTS_EUR[plan] * 100;
		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			customer: customerId,
			success_url: `${baseUrl}/parametres?billing=success&plan=${plan}`,
			cancel_url: `${baseUrl}/tarifs?billing=cancelled`,
			metadata: {
				organizationId: String(organizationId),
				saasPlan: plan,
			},
			subscription_data: {
				metadata: {
					organizationId: String(organizationId),
					saasPlan: plan,
				},
			},
			line_items: [
				{
					price_data: {
						currency: 'eur',
						unit_amount: amountCents,
						recurring: { interval: 'month' },
						product_data: {
							name: PLAN_LABELS[plan],
							description: 'Abonnement mensuel Facturio (plateforme)',
						},
					},
					quantity: 1,
				},
			],
		});

		if (!session.url) {
			throw new ServiceUnavailableException('Impossible de créer la session Stripe Checkout');
		}

		return { url: session.url };
	}

	async handlePlatformWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
		const stripe = this.ensurePlatformStripe();
		const secret = this.config.stripeWebhookSecret?.trim();
		if (!secret) {
			throw new BadRequestException('STRIPE_WEBHOOK_SECRET plateforme non configuré');
		}

		let event: PlatformStripeWebhookEvent;
		try {
			event = stripe.webhooks.constructEvent(rawBody, signature, secret) as unknown as PlatformStripeWebhookEvent;
		} catch (err) {
			this.logger.warn(`Webhook plateforme invalide: ${(err as Error).message}`);
			throw new BadRequestException('Signature webhook invalide');
		}

		switch (event.type) {
			case 'checkout.session.completed':
				await this.onCheckoutCompleted(event.data.object);
				break;
			case 'customer.subscription.updated':
			case 'customer.subscription.deleted':
				await this.onSubscriptionChange(event.data.object);
				break;
			default:
				break;
		}

		return { received: true };
	}

	private async onCheckoutCompleted(session: Record<string, unknown>) {
		const meta = readStripeMetadata(session);
		const orgId = Number(meta.organizationId);
		const plan = meta.saasPlan;
		if (!orgId || !plan) return;

		const saasPlan = this.toSaasPlan(plan);
		if (!saasPlan) return;

		const subscriptionId =
			typeof session.subscription === 'string' ? session.subscription : undefined;

		await this.prisma.organization.update({
			where: { id: orgId },
			data: {
				saasPlan,
				stripeSubscriptionId: subscriptionId ?? undefined,
			},
		});
		this.logger.log(`Organisation ${orgId} passée au plan ${saasPlan}`);
	}

	private async onSubscriptionChange(subscription: Record<string, unknown>) {
		const meta = readStripeMetadata(subscription);
		const orgId = Number(meta.organizationId);
		if (!orgId) return;

		const status = subscription.status as string | undefined;
		if (status === 'active' || status === 'trialing') {
			const plan = meta.saasPlan;
			const saasPlan = this.toSaasPlan(plan || 'PRO');
			if (saasPlan) {
				await this.prisma.organization.update({
					where: { id: orgId },
					data: {
						saasPlan,
						stripeSubscriptionId: String(subscription.id),
					},
				});
			}
			return;
		}

		if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
			await this.prisma.organization.update({
				where: { id: orgId },
				data: {
					saasPlan: SaasBillingPlan.FREE,
					stripeSubscriptionId: null,
				},
			});
		}
	}

	private toSaasPlan(value: string): SaasBillingPlan | null {
		if (value === 'PRO') return SaasBillingPlan.PRO;
		if (value === 'PRO_EFACTURE') return SaasBillingPlan.PRO_EFACTURE;
		if (value === 'AGENCY') return SaasBillingPlan.AGENCY;
		return null;
	}

	/** Clé publique plateforme (checkout Facturio uniquement). */
	getPlatformPublishableKey(): string | null {
		const pk = this.config.stripePublishableKey?.trim();
		return pk || null;
	}
}
