import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { assertValidPublicToken } from '../invoices/public-token.util';
import { decryptOrgStripeSecrets } from '../crypto/organization-stripe-secrets.util';
import { SecretsCryptoService } from '../crypto/secrets-crypto.service';
import { createStripeClient, type StripeClient } from './stripe-client';

export interface PaymentIntentResponse {
	clientSecret: string;
	amount: number;
	currency: string;
	stripePublishableKey: string;
}

interface StripePaymentIntentPayload {
	id: string;
	metadata?: { invoiceId?: string };
	amount_received: number;
}

/**
 * Paiements Stripe des **factures clients** — utilise les clés Stripe **de l'organisation** (BDD).
 * Ne jamais utiliser les clés plateforme .env ici (réservées à l'abonnement Facturio).
 */
@Injectable()
export class StripeService {
	private readonly logger = new Logger(StripeService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly payments: PaymentsService,
		private readonly secretsCrypto: SecretsCryptoService,
	) {}

	private resolveOrgStripe(org: {
		invoiceStripeSecretKey: string | null;
		invoiceStripePublishableKey: string | null;
		invoiceStripeWebhookSecret?: string | null;
	}) {
		return decryptOrgStripeSecrets(this.secretsCrypto, org);
	}

	private getOrgStripeClient(org: {
		invoiceStripeSecretKey: string | null;
		invoiceStripePublishableKey: string | null;
	}): StripeClient {
		const { secretKey } = this.resolveOrgStripe(org);
		if (!secretKey?.trim()) {
			throw new ServiceUnavailableException(
				'Paiement en ligne non configuré : ajoutez vos clés Stripe prestataire dans Paramètres.',
			);
		}
		return createStripeClient(secretKey.trim());
	}

	isOrgStripeConfigured(org: {
		invoiceStripeSecretKey: string | null;
		invoiceStripePublishableKey: string | null;
	}): boolean {
		const { secretKey, publishableKey } = this.resolveOrgStripe(org);
		return !!(secretKey?.trim() && publishableKey?.trim());
	}

	private async getInvoiceByPublicToken(token: string) {
		const safeToken = assertValidPublicToken(token);
		const invoice = await this.prisma.invoice.findUnique({
			where: { publicToken: safeToken },
			include: {
				payments: true,
				organization: {
					select: {
						id: true,
						invoiceStripeSecretKey: true,
						invoiceStripePublishableKey: true,
						invoiceStripeWebhookSecret: true,
					},
				},
			},
		});
		if (!invoice || !invoice.sentAt) {
			throw new NotFoundException('Facture introuvable');
		}
		if (!invoice.organization) {
			throw new ServiceUnavailableException('Organisation de la facture introuvable');
		}
		return invoice;
	}

	private getRemainingAmount(invoice: { total: unknown; payments: { amount: unknown }[] }): number {
		const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
		return Math.round((Number(invoice.total) - totalPaid) * 100) / 100;
	}

	async createPaymentIntentForInvoice(token: string): Promise<PaymentIntentResponse> {
		const safeToken = assertValidPublicToken(token);
		const invoice = await this.getInvoiceByPublicToken(safeToken);
		const org = invoice.organization!;
		const stripe = this.getOrgStripeClient(org);
		const { publishableKey } = this.resolveOrgStripe(org);
		if (!publishableKey) {
			throw new ServiceUnavailableException('Clé publishable Stripe prestataire manquante');
		}
		const remaining = this.getRemainingAmount(invoice);

		if (remaining <= 0) {
			throw new BadRequestException('Cette facture est déjà réglée');
		}

		const amountCents = Math.round(remaining * 100);
		const currency = (invoice.currency || 'EUR').toLowerCase();

		const paymentIntent = await stripe.paymentIntents.create({
			amount: amountCents,
			currency,
			metadata: {
				invoiceId: String(invoice.id),
				organizationId: String(org.id),
				publicToken: safeToken,
				invoiceNumber: invoice.number,
			},
			automatic_payment_methods: { enabled: true },
		});

		if (!paymentIntent.client_secret) {
			throw new ServiceUnavailableException('Impossible de créer le paiement Stripe');
		}

		return {
			clientSecret: paymentIntent.client_secret,
			amount: remaining,
			currency: invoice.currency || 'EUR',
			stripePublishableKey: publishableKey,
		};
	}

	async handleOrgWebhook(
		organizationId: number,
		rawBody: Buffer,
		signature: string,
	): Promise<{ received: boolean }> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: {
				invoiceStripeSecretKey: true,
				invoiceStripePublishableKey: true,
				invoiceStripeWebhookSecret: true,
			},
		});
		if (!org) {
			throw new BadRequestException('Organisation introuvable');
		}
		const { secretKey, webhookSecret } = this.resolveOrgStripe(org);
		if (!secretKey?.trim()) {
			throw new BadRequestException('Stripe prestataire non configuré');
		}
		if (!webhookSecret?.trim()) {
			throw new BadRequestException('invoiceStripeWebhookSecret non configuré pour cette organisation');
		}

		const stripe = createStripeClient(secretKey.trim());
		let event: { type: string; data: { object: StripePaymentIntentPayload } };
		try {
			event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret.trim()) as typeof event;
		} catch (err) {
			this.logger.warn(`Webhook Stripe org ${organizationId} invalide: ${(err as Error).message}`);
			throw new BadRequestException('Signature webhook invalide');
		}

		if (event.type === 'payment_intent.succeeded') {
			await this.fulfillPaymentIntent(event.data.object);
		}

		return { received: true };
	}

	async confirmPaymentIntentForInvoice(token: string, paymentIntentId: string): Promise<{ ok: boolean }> {
		assertValidPublicToken(token);
		const invoice = await this.getInvoiceByPublicToken(token);
		const stripe = this.getOrgStripeClient(invoice.organization!);

		const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
		if (paymentIntent.status !== 'succeeded') {
			throw new BadRequestException("Le paiement n'est pas encore confirmé");
		}
		if (paymentIntent.metadata?.invoiceId !== String(invoice.id)) {
			throw new BadRequestException('Paiement non associé à cette facture');
		}

		await this.fulfillPaymentIntent({
			id: paymentIntent.id,
			metadata: paymentIntent.metadata,
			amount_received: paymentIntent.amount_received,
		});

		return { ok: true };
	}

	async fulfillPaymentIntent(paymentIntent: StripePaymentIntentPayload): Promise<void> {
		const invoiceId = Number(paymentIntent.metadata?.invoiceId);
		if (!invoiceId || Number.isNaN(invoiceId)) {
			this.logger.warn(`PaymentIntent ${paymentIntent.id} sans invoiceId dans metadata`);
			return;
		}

		const stripeRef = `stripe:${paymentIntent.id}`;
		const existing = await this.prisma.payment.findFirst({
			where: { notes: stripeRef },
		});
		if (existing) return;

		const invoice = await this.prisma.invoice.findUnique({
			where: { id: invoiceId },
			include: { payments: true },
		});
		if (!invoice) {
			this.logger.warn(`Facture ${invoiceId} introuvable pour PaymentIntent ${paymentIntent.id}`);
			return;
		}

		const remaining = this.getRemainingAmount(invoice);
		const paidAmount = Math.round((paymentIntent.amount_received / 100) * 100) / 100;
		const amount = Math.min(paidAmount, remaining);

		if (amount <= 0) return;

		await this.payments.create({
			invoiceId,
			amount,
			method: 'STRIPE',
			notes: stripeRef,
		});
	}
}
