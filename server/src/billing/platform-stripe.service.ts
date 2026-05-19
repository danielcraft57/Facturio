import {
	BadRequestException,
	Injectable,
	Logger,
	ServiceUnavailableException,
} from '@nestjs/common';
import { Organization, SaasBillingPlan } from '@prisma/client';
import { ConfigService } from '../config/config.service';
import { EmailService } from '../common/email.service';
import { PdfService } from '../common/pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import { buildSubscriptionInvoicePdfPayload } from './subscription-invoice-pdf';
import { SAAS_PLAN_LIMITS } from './saas-plan.limits';
import { createStripeClient } from '../stripe/stripe-client';
import type { SaasCheckoutSchedule } from './dto/create-checkout.dto';

const PLAN_AMOUNTS_EUR: Record<'PRO' | 'PRO_EFACTURE', number> = {
	PRO: 12,
	PRO_EFACTURE: 24,
};

const PLAN_LABELS: Record<'PRO' | 'PRO_EFACTURE', string> = {
	PRO: 'Facturio Pro',
	PRO_EFACTURE: 'Facturio Pro + e-facture',
};

type PlatformStripeWebhookEvent = {
	id: string;
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

function unixToDate(value: unknown): Date | null {
	if (typeof value === 'number' && value > 0) return new Date(value * 1000);
	return null;
}

/** Statut Stripe « actif » mais résiliation demandée en fin de période. */
function mapStripeSubscriptionStatus(sub: {
	status?: string;
	cancel_at_period_end?: boolean;
}): string {
	const status = String(sub.status ?? '');
	if (
		(status === 'active' || status === 'trialing') &&
		sub.cancel_at_period_end === true
	) {
		return 'cancel_at_period_end';
	}
	return status;
}

/** Client Stripe inexistant sur ce compte / ce mode (ex. clés test après données live). */
function isStaleStripeCustomerError(err: unknown): boolean {
	if (!err || typeof err !== 'object') return false;
	const e = err as { code?: string; message?: string };
	return (
		e.code === 'resource_missing' ||
		(typeof e.message === 'string' && e.message.includes('No such customer'))
	);
}

function subscriptionBillingMonths(schedule: 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL'): number {
	switch (schedule) {
		case 'MONTHLY':
			return 1;
		case 'QUARTERLY':
			return 3;
		case 'BIANNUAL':
			return 6;
	}
}

@Injectable()
export class PlatformStripeService {
	private readonly logger = new Logger(PlatformStripeService.name);

	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
		private readonly emailService: EmailService,
		private readonly pdfService: PdfService,
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
		options: { billingSchedule: SaasCheckoutSchedule } = { billingSchedule: 'MONTHLY' },
	): Promise<{ url: string }> {
		const stripe = this.ensurePlatformStripe();
		const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
		if (!org) throw new BadRequestException('Organisation introuvable');

		const billingSchedule = options.billingSchedule ?? 'MONTHLY';

		let customerId = org.stripeCustomerId;
		if (customerId) {
			try {
				await stripe.customers.retrieve(customerId);
			} catch (err) {
				if (!isStaleStripeCustomerError(err)) throw err;
				this.logger.warn(
					`stripeCustomerId ${customerId} introuvable sur ce compte Stripe (org ${organizationId}) — nouvelle fiche client (souvent clés test/live ou compte différent).`,
				);
				await this.prisma.organization.update({
					where: { id: organizationId },
					data: {
						stripeCustomerId: null,
						stripeSubscriptionId: null,
						saasSubscriptionStatus: null,
					},
				});
				customerId = null;
			}
		}

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

		await this.syncStripeCustomerProfile(stripe, customerId, org, userEmail);

		const successBase = this.config.billingCheckoutSuccessUrl;
		const successUrl = `${successBase}${successBase.includes('?') ? '&' : '?'}plan=${plan}`;
		const metaBase = {
			organizationId: String(organizationId),
			saasPlan: plan,
			billingSchedule,
		};
		let session: { url: string | null };
		if (billingSchedule === 'YEARLY_UPFRONT') {
			const amountCents = PLAN_AMOUNTS_EUR[plan] * 12 * 100;
			session = await this.createStripeCheckoutSession(stripe, {
				mode: 'payment',
				customer: customerId,
				success_url: successUrl,
				cancel_url: this.config.billingCheckoutCancelUrl,
				metadata: metaBase,
				invoice_creation: {
					enabled: true,
					invoice_data: {
						description: `${PLAN_LABELS[plan]} — 12 mois (paiement unique)`,
						metadata: metaBase,
					},
				},
				line_items: [
					{
						price_data: {
							currency: 'eur',
							unit_amount: amountCents,
							product_data: {
								name: `${PLAN_LABELS[plan]} — 12 mois`,
								description:
									'Paiement unique pour 12 mois d’accès. Sans prélèvement récurrent sur cette période.',
							},
						},
						quantity: 1,
					},
				],
			});
		} else {
			const months = subscriptionBillingMonths(billingSchedule);
			const amountCents = PLAN_AMOUNTS_EUR[plan] * months * 100;
			const periodLabel =
				months === 1 ? 'mensuel' : months === 3 ? 'tous les 3 mois' : 'tous les 6 mois';
			session = await this.createStripeCheckoutSession(stripe, {
				mode: 'subscription',
				customer: customerId,
				success_url: successUrl,
				cancel_url: this.config.billingCheckoutCancelUrl,
				metadata: metaBase,
				subscription_data: {
					metadata: metaBase,
				},
				line_items: [
					{
						price_data: {
							currency: 'eur',
							unit_amount: amountCents,
							recurring: { interval: 'month', interval_count: months },
							product_data: {
								name: PLAN_LABELS[plan],
								description: `Abonnement Facturio (plateforme) — prélèvement ${periodLabel}.`,
							},
						},
						quantity: 1,
					},
				],
			});
		}

		if (!session.url) {
			throw new ServiceUnavailableException('Impossible de créer la session Stripe Checkout');
		}

		return { url: session.url };
	}

	private async createStripeCheckoutSession(
		stripe: ReturnType<typeof createStripeClient>,
		params: Record<string, unknown>,
	): Promise<{ url: string | null }> {
		const mode = params.mode as 'payment' | 'subscription';
		try {
			return await stripe.checkout.sessions.create({
				...params,
				...this.buildCheckoutSessionUi(mode),
			} as never);
		} catch (err) {
			const message = (err as Error).message || 'Erreur Stripe Checkout';
			this.logger.warn(`Stripe checkout.sessions.create: ${message}`);
			throw new BadRequestException(
				message.includes('paypal') && message.includes('not activated')
					? 'PayPal n’est pas activé sur votre compte Stripe. Activez-le dans Paramètres → Moyens de paiement (mode test).'
					: `Stripe : ${message}`,
			);
		}
	}

	/** Personnalisation Checkout (doc Stripe : branding_settings, custom_text). */
	private buildCheckoutSessionUi(mode: 'payment' | 'subscription'): Record<string, unknown> {
		const branding: Record<string, unknown> = {
			display_name: this.config.stripeCheckoutDisplayName,
			border_style: this.config.stripeCheckoutBorderStyle,
			font_family: this.config.stripeCheckoutFontFamily,
		};
		const logoId = this.config.stripeCheckoutLogoFileId?.trim();
		if (logoId) {
			branding.logo = { type: 'file', file: logoId };
		}
		const paymentMethodTypes = this.config.stripeCheckoutPaymentMethodTypes;
		const ui: Record<string, unknown> = {
			locale: 'fr',
			payment_method_types: paymentMethodTypes,
			wallet_options: {
				link: { display: 'never' },
			},
			branding_settings: branding,
			custom_text: {
				submit: {
					message:
						'Paiement sécurisé par Stripe. Après validation, vous serez renvoyé vers Facturio.',
				},
			},
			billing_address_collection: 'required',
			customer_update: {
				name: 'auto',
				address: 'auto',
			},
		};
		// preferred_locale PayPal : autorisé en mode payment uniquement (Stripe API).
		if (mode === 'payment' && paymentMethodTypes.includes('paypal')) {
			ui.payment_method_options = {
				paypal: { preferred_locale: 'fr-FR' },
			};
		}
		return ui;
	}

	private async syncStripeCustomerProfile(
		stripe: ReturnType<typeof createStripeClient>,
		customerId: string,
		org: Organization,
		userEmail: string,
	): Promise<void> {
		const line1 = org.address?.trim();
		const address =
			line1 && line1.length > 0
				? {
						line1,
						line2: org.address2?.trim() || undefined,
						city: org.city?.trim() || undefined,
						postal_code: org.zipCode?.trim() || undefined,
						country: (org.countryCode || org.country || 'FR').toUpperCase().slice(0, 2),
					}
				: undefined;

		try {
			await stripe.customers.update(customerId, {
				email: userEmail,
				name: (org.legalName || org.name || 'Client').trim(),
				...(org.phone?.trim() ? { phone: org.phone.trim() } : {}),
				...(address ? { address } : {}),
				preferred_locales: ['fr'],
			});
		} catch (err) {
			this.logger.warn(
				`Mise à jour fiche client Stripe ${customerId} ignorée: ${(err as Error).message}`,
			);
		}
	}

	/**
	 * Synchronise plan + état d'abonnement depuis Stripe (checkout, portail, résiliation).
	 * Utile sans webhook ou après annulation dans le portail Stripe.
	 */
	async syncOrganizationFromStripe(
		organizationId: number,
	): Promise<{ synced: boolean; plan: SaasBillingPlan; subscriptionStatus: string | null }> {
		const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
		if (!org) throw new BadRequestException('Organisation introuvable');

		if (!org.stripeCustomerId) {
			return { synced: false, plan: org.saasPlan, subscriptionStatus: org.saasSubscriptionStatus };
		}

		const stripe = this.ensurePlatformStripe();
		const wasFree = org.saasPlan === SaasBillingPlan.FREE;

		const subs = await stripe.subscriptions.list({
			customer: org.stripeCustomerId,
			status: 'all',
			limit: 10,
		});
		const activeSub = subs.data.find((s) => s.status === 'active' || s.status === 'trialing');
		if (activeSub) {
			const meta = readStripeMetadata(activeSub as unknown as Record<string, unknown>);
			const saasPlan = this.toSaasPlan(meta.saasPlan || 'PRO') ?? SaasBillingPlan.PRO;
			const storedStatus = mapStripeSubscriptionStatus(
				activeSub as { status?: string; cancel_at_period_end?: boolean },
			);
			const periodEnd = unixToDate(
				(activeSub as { current_period_end?: number }).current_period_end,
			);
			await this.prisma.organization.update({
				where: { id: organizationId },
				data: {
					saasPlan,
					stripeSubscriptionId: activeSub.id,
					saasSubscriptionStatus: storedStatus,
					saasPlanExpiresAt: periodEnd,
				},
			});
			if (wasFree) {
				await this.notifySubscriptionActivated(organizationId, saasPlan);
			}
			this.logger.log(
				`Sync Stripe → org ${organizationId} plan ${saasPlan} (statut ${storedStatus})`,
			);
			return { synced: true, plan: saasPlan, subscriptionStatus: storedStatus };
		}

		const accessStillValid =
			org.saasPlan !== SaasBillingPlan.FREE &&
			org.saasPlanExpiresAt != null &&
			org.saasPlanExpiresAt > new Date();

		if (!accessStillValid && org.saasPlan !== SaasBillingPlan.FREE) {
			await this.downgradeOrganizationToFree(organizationId, 'canceled');
			return { synced: true, plan: SaasBillingPlan.FREE, subscriptionStatus: 'canceled' };
		}

		if (wasFree) {
			const sessions = await stripe.checkout.sessions.list({
				customer: org.stripeCustomerId,
				limit: 10,
			});
			const completed = sessions.data
				.filter(
					(s) =>
						s.status === 'complete' &&
						(s.payment_status === 'paid' || s.payment_status === 'no_payment_required'),
				)
				.sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];

			if (completed) {
				await this.onCheckoutCompleted(completed as unknown as Record<string, unknown>);
				const updated = await this.prisma.organization.findUnique({
					where: { id: organizationId },
					select: { saasPlan: true, saasSubscriptionStatus: true },
				});
				const plan = updated?.saasPlan ?? org.saasPlan;
				return {
					synced: plan !== SaasBillingPlan.FREE,
					plan,
					subscriptionStatus: updated?.saasSubscriptionStatus ?? null,
				};
			}
		}

		return {
			synced: accessStillValid,
			plan: org.saasPlan,
			subscriptionStatus: org.saasSubscriptionStatus,
		};
	}

	private async downgradeOrganizationToFree(
		organizationId: number,
		status: string,
	): Promise<void> {
		const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
		const previousPlan = org?.saasPlan ?? SaasBillingPlan.FREE;
		await this.prisma.organization.update({
			where: { id: organizationId },
			data: {
				saasPlan: SaasBillingPlan.FREE,
				saasSubscriptionStatus: status,
				stripeSubscriptionId: null,
				saasPlanExpiresAt: null,
			},
		});
		if (previousPlan !== SaasBillingPlan.FREE) {
			await this.notifySubscriptionCanceled(organizationId, previousPlan);
		}
	}

	async createPortalSession(organizationId: number): Promise<{ url: string }> {
		const stripe = this.ensurePlatformStripe();
		const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
		if (!org?.stripeCustomerId) {
			throw new BadRequestException(
				'Aucun abonnement Stripe associé. Souscrivez d’abord à un plan payant.',
			);
		}

		let customerId = org.stripeCustomerId;
		try {
			await stripe.customers.retrieve(customerId);
		} catch (err) {
			if (!isStaleStripeCustomerError(err)) throw err;
			this.logger.warn(
				`Portail: stripeCustomerId ${customerId} introuvable (org ${organizationId}) — nettoyage des identifiants Stripe obsolètes.`,
			);
			await this.prisma.organization.update({
				where: { id: organizationId },
				data: {
					stripeCustomerId: null,
					stripeSubscriptionId: null,
					saasSubscriptionStatus: null,
				},
			});
			throw new BadRequestException(
				'Le client Stripe enregistré n’existe plus sur ce compte (ex. passage en mode test). Refaites une souscription depuis la page abonnement.',
			);
		}

		const session = await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: this.config.billingPortalReturnUrl,
		});

		if (!session.url) {
			throw new ServiceUnavailableException('Impossible d’ouvrir le portail de facturation');
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

		return this.processVerifiedPlatformEvent(event);
	}

	/** Traitement après vérification de signature (webhook plateforme ou unifié). */
	async processVerifiedPlatformEvent(event: PlatformStripeWebhookEvent): Promise<{ received: boolean }> {
		const existing = await this.prisma.stripePlatformEvent.findUnique({
			where: { eventId: event.id },
		});
		if (existing) {
			this.logger.debug(`Webhook plateforme déjà traité: ${event.id}`);
			return { received: true };
		}

		const orgId = await this.resolveOrganizationId(event);
		await this.prisma.stripePlatformEvent.create({
			data: {
				eventId: event.id,
				type: event.type,
				organizationId: orgId ?? undefined,
			},
		});

		try {
			switch (event.type) {
				case 'checkout.session.completed':
					await this.onCheckoutCompleted(event.data.object);
					break;
				case 'customer.subscription.updated':
				case 'customer.subscription.deleted':
					await this.onSubscriptionChange(event.data.object, event.type);
					break;
				case 'invoice.payment_failed':
					await this.onInvoicePaymentFailed(event.data.object);
					break;
				case 'invoice.paid':
					await this.onInvoicePaid(event.data.object);
					break;
				default:
					break;
			}
		} catch (err) {
			this.logger.error(`Erreur traitement webhook ${event.type}: ${(err as Error).message}`, (err as Error).stack);
			throw err;
		}

		return { received: true };
	}

	private async resolveOrganizationId(event: PlatformStripeWebhookEvent): Promise<number | null> {
		const obj = event.data.object;
		const meta = readStripeMetadata(obj);
		let orgId = Number(meta.organizationId);
		if (orgId) return orgId;

		const customerId = typeof obj.customer === 'string' ? obj.customer : undefined;
		if (customerId) {
			const org = await this.prisma.organization.findFirst({
				where: { stripeCustomerId: customerId },
				select: { id: true },
			});
			return org?.id ?? null;
		}
		return null;
	}

	private async onCheckoutCompleted(session: Record<string, unknown>) {
		const paymentStatus = session.payment_status as string | undefined;
		if (paymentStatus && paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') {
			this.logger.warn(`Checkout session non payée: status=${paymentStatus}`);
			return;
		}

		const meta = readStripeMetadata(session);
		const orgId = Number(meta.organizationId);
		const plan = meta.saasPlan;
		if (!orgId || !plan) return;

		const saasPlan = this.toSaasPlan(plan);
		if (!saasPlan) return;

		const orgBefore = await this.prisma.organization.findUnique({
			where: { id: orgId },
			select: { saasPlan: true },
		});
		const wasFree = orgBefore?.saasPlan === SaasBillingPlan.FREE;

		const mode = session.mode as string | undefined;

		if (mode === 'payment' && meta.billingSchedule === 'YEARLY_UPFRONT') {
			const expires = new Date();
			expires.setFullYear(expires.getFullYear() + 1);
			await this.prisma.organization.update({
				where: { id: orgId },
				data: {
					saasPlan,
					stripeSubscriptionId: null,
					saasSubscriptionStatus: 'active',
					saasPlanExpiresAt: expires,
				},
			});
			this.logger.log(
				`Organisation ${orgId} → plan ${saasPlan} (paiement unique 12 mois), fin d’accès ${expires.toISOString()}`,
			);
			if (wasFree) await this.notifySubscriptionActivated(orgId, saasPlan);
			const invoiceId = typeof session.invoice === 'string' ? session.invoice : undefined;
			if (invoiceId) await this.sendStripeSubscriptionInvoiceIfNeeded(orgId, invoiceId);
			return;
		}

		if (mode !== 'subscription') return;

		const subscriptionId =
			typeof session.subscription === 'string' ? session.subscription : undefined;

		let periodEnd: Date | null = null;
		let status = 'active';
		let latestInvoiceId: string | undefined;
		if (subscriptionId) {
			const stripe = this.ensurePlatformStripe();
			const sub = await stripe.subscriptions.retrieve(subscriptionId);
			periodEnd = unixToDate((sub as { current_period_end?: number }).current_period_end);
			status = mapStripeSubscriptionStatus(
				sub as { status?: string; cancel_at_period_end?: boolean },
			);
			const latest = (sub as { latest_invoice?: string | { id?: string } }).latest_invoice;
			latestInvoiceId = typeof latest === 'string' ? latest : latest?.id;
		}

		await this.prisma.organization.update({
			where: { id: orgId },
			data: {
				saasPlan,
				stripeSubscriptionId: subscriptionId ?? undefined,
				saasSubscriptionStatus: status,
				saasPlanExpiresAt: periodEnd,
			},
		});

		this.logger.log(`Organisation ${orgId} → plan ${saasPlan} (checkout)`);
		if (wasFree) await this.notifySubscriptionActivated(orgId, saasPlan);
		if (latestInvoiceId) {
			await this.sendStripeSubscriptionInvoiceIfNeeded(orgId, latestInvoiceId);
		}
	}

	private async onSubscriptionChange(subscription: Record<string, unknown>, eventType: string) {
		const meta = readStripeMetadata(subscription);
		const orgId = Number(meta.organizationId);
		if (!orgId) return;

		const status = String(subscription.status ?? '');
		const periodEnd = unixToDate(subscription.current_period_end);
		const subscriptionId = String(subscription.id ?? '');

		if (status === 'active' || status === 'trialing') {
			const plan = meta.saasPlan;
			const saasPlan = this.toSaasPlan(plan || 'PRO');
			const storedStatus = mapStripeSubscriptionStatus(
				subscription as { status?: string; cancel_at_period_end?: boolean },
			);
			if (saasPlan) {
				await this.prisma.organization.update({
					where: { id: orgId },
					data: {
						saasPlan,
						stripeSubscriptionId: subscriptionId,
						saasSubscriptionStatus: storedStatus,
						saasPlanExpiresAt: periodEnd,
					},
				});
				this.logger.log(
					`Organisation ${orgId} → plan ${saasPlan} (abonnement ${storedStatus})`,
				);
			}
			return;
		}

		if (status === 'past_due') {
			await this.prisma.organization.update({
				where: { id: orgId },
				data: {
					saasSubscriptionStatus: status,
					saasPlanExpiresAt: periodEnd,
					stripeSubscriptionId: subscriptionId,
				},
			});
			await this.notifyPaymentFailed(orgId);
			return;
		}

		if (
			status === 'canceled' ||
			status === 'unpaid' ||
			eventType === 'customer.subscription.deleted'
		) {
			const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
			const periodStillValid =
				periodEnd != null && periodEnd > new Date() && org?.saasPlan !== SaasBillingPlan.FREE;

			if (periodStillValid) {
				await this.prisma.organization.update({
					where: { id: orgId },
					data: {
						saasSubscriptionStatus: 'cancel_at_period_end',
						saasPlanExpiresAt: periodEnd,
						stripeSubscriptionId: null,
					},
				});
				return;
			}

			await this.downgradeOrganizationToFree(orgId, status || 'canceled');
		}
	}

	private async onInvoicePaid(invoice: Record<string, unknown>) {
		const customerId = typeof invoice.customer === 'string' ? invoice.customer : undefined;
		const invoiceId = typeof invoice.id === 'string' ? invoice.id : undefined;
		if (!customerId || !invoiceId) return;

		const org = await this.prisma.organization.findFirst({
			where: { stripeCustomerId: customerId },
		});
		if (!org) return;

		await this.sendStripeSubscriptionInvoiceIfNeeded(org.id, invoiceId);
	}

	private async sendStripeSubscriptionInvoiceIfNeeded(
		organizationId: number,
		invoiceId: string,
	): Promise<void> {
		const eventId = `invoice_email:${invoiceId}`;
		const existing = await this.prisma.stripePlatformEvent.findUnique({
			where: { eventId },
		});
		if (existing) return;

		const stripe = this.ensurePlatformStripe();
		let invoice: {
			customer?: string | { id?: string } | null;
			number?: string | null;
			amount_paid?: number | null;
			invoice_pdf?: string | null;
			hosted_invoice_url?: string | null;
			status?: string | null;
		};
		try {
			invoice = await stripe.invoices.retrieve(invoiceId, { expand: ['lines.data'] });
		} catch (err) {
			this.logger.warn(`Facture Stripe ${invoiceId} illisible: ${(err as Error).message}`);
			return;
		}

		const customerRef = invoice.customer;
		const customerId =
			typeof customerRef === 'string' ? customerRef : customerRef?.id ?? undefined;
		if (!customerId) return;

		const org = await this.prisma.organization.findFirst({
			where: { id: organizationId, stripeCustomerId: customerId },
		});
		if (!org) return;

		const recipient = await this.resolveBillingEmail(organizationId);
		if (!recipient) return;

		const payload = buildSubscriptionInvoicePdfPayload(
			invoice as Record<string, unknown>,
			org,
			recipient.email,
		);
		let pdfBuffer: Buffer | null = null;
		try {
			pdfBuffer = await this.pdfService.generateSubscriptionInvoicePdf(payload);
		} catch (err) {
			this.logger.warn(
				`Génération PDF facture abonnement: ${(err as Error).message}`,
			);
		}
		if (!pdfBuffer) {
			this.logger.warn(`PDF facture abonnement non généré (${invoiceId})`);
			return;
		}

		const invoiceNumber = invoice.number?.trim() || invoiceId;
		const amountEur = (invoice.amount_paid ?? 0) / 100;

		await this.emailService.sendSubscriptionInvoice({
			to: recipient.email,
			firstName: recipient.firstName,
			clientName:
				org.legalName?.trim() || org.name?.trim() || recipient.firstName || 'Client',
			invoiceNumber,
			invoiceDate: payload.date,
			amountEur,
			pdfBuffer,
			hostedInvoiceUrl: invoice.hosted_invoice_url,
		});

		await this.prisma.stripePlatformEvent.create({
			data: {
				eventId,
				type: 'invoice.email.sent',
				organizationId,
			},
		});
		this.logger.log(`Facture abonnement ${invoiceNumber} envoyée à ${recipient.email}`);
	}

	private async onInvoicePaymentFailed(invoice: Record<string, unknown>) {
		const customerId = typeof invoice.customer === 'string' ? invoice.customer : undefined;
		if (!customerId) return;
		const org = await this.prisma.organization.findFirst({
			where: { stripeCustomerId: customerId },
		});
		if (!org) return;
		await this.prisma.organization.update({
			where: { id: org.id },
			data: { saasSubscriptionStatus: 'past_due' },
		});
		await this.notifyPaymentFailed(org.id);
	}

	private async notifySubscriptionActivated(orgId: number, plan: SaasBillingPlan) {
		const recipient = await this.resolveBillingEmail(orgId);
		if (!recipient) return;
		const limits = SAAS_PLAN_LIMITS[plan];
		await this.emailService.sendSubscriptionActivated({
			to: recipient.email,
			firstName: recipient.firstName,
			planLabel: limits.label,
			settingsUrl: this.config.billingPortalReturnUrl,
		});
	}

	private async notifyPaymentFailed(orgId: number) {
		const recipient = await this.resolveBillingEmail(orgId);
		if (!recipient) return;
		let manageUrl = this.config.billingPortalReturnUrl;
		try {
			const portal = await this.createPortalSession(orgId);
			manageUrl = portal.url;
		} catch {
			// Portail indisponible — lien paramètres
		}
		await this.emailService.sendSubscriptionPaymentFailed({
			to: recipient.email,
			firstName: recipient.firstName,
			manageUrl,
		});
	}

	private async notifySubscriptionCanceled(orgId: number, plan: SaasBillingPlan) {
		const recipient = await this.resolveBillingEmail(orgId);
		if (!recipient) return;
		const limits = SAAS_PLAN_LIMITS[plan];
		await this.emailService.sendSubscriptionCanceled({
			to: recipient.email,
			firstName: recipient.firstName,
			planLabel: limits.label,
		});
	}

	private async resolveBillingEmail(
		organizationId: number,
	): Promise<{ email: string; firstName?: string | null } | null> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: { email: true },
		});
		if (org?.email?.trim()) {
			return { email: org.email.trim(), firstName: null };
		}
		const admin = await this.prisma.user.findFirst({
			where: { organizationId, role: 'ADMIN', status: 'ACTIVE' },
			orderBy: { id: 'asc' },
			select: { email: true, firstName: true },
		});
		if (!admin?.email) return null;
		return { email: admin.email, firstName: admin.firstName };
	}

	private toSaasPlan(value: string): SaasBillingPlan | null {
		if (value === 'PRO') return SaasBillingPlan.PRO;
		if (value === 'PRO_EFACTURE') return SaasBillingPlan.PRO_EFACTURE;
		if (value === 'AGENCY') return SaasBillingPlan.AGENCY;
		return null;
	}

	getPlatformPublishableKey(): string | null {
		const pk = this.config.stripePublishableKey?.trim();
		return pk || null;
	}
}
