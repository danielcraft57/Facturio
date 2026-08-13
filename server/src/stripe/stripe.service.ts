import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
	ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { assertValidPublicToken } from '../invoices/public-token.util';
import { canAccessInvoiceByPublicToken } from '../invoices/invoice-public-access.util';
import { decryptOrgStripeSecrets } from '../crypto/organization-stripe-secrets.util';
import { SecretsCryptoService } from '../crypto/secrets-crypto.service';
import { createStripeClient, type StripeClient } from './stripe-client';
import { parseInvoiceStripePaymentMethodsStored } from './invoice-stripe-payment-methods';
import {
	ensureInvoicePaymentMethodTypes,
	filterBnplPaymentMethodsForAmount,
	resolveActiveBnplPaymentMethods,
} from './invoice-bnpl-payment-methods.util';
import { InvoiceInstallmentsService } from '../invoices/invoice-installments.service';
import { InvoiceInstallmentReleaseService } from '../invoices/invoice-installment-release.service';

export interface PaymentIntentResponse {
	clientSecret: string;
	amount: number;
	currency: string;
	stripePublishableKey: string;
	/** Moyens BNPL (Klarna, Alma) effectivement proposés pour ce montant. */
	bnplMethods: string[];
	/** Échéance métier en cours (paiement fractionné B2B). */
	installmentId: number | null;
	installmentSequence: number | null;
	/** Identifiant Stripe du PaymentIntent créé. */
	paymentIntentId: string;
}

export interface StripePaymentIntentPayload {
	id: string;
	metadata?: { invoiceId?: string };
	amount_received: number;
}

/** Résultat d'un remboursement Stripe (création ou reprise d'un refund déjà existant). */
export interface StripeRefundResult {
	refundId: string;
	alreadyRefunded: boolean;
}

type InvoiceForStripePayment = {
	id: string;
	number: string;
	currency: string | null;
	total: unknown;
	status: string;
	publicToken: string | null;
	payments: { amount: unknown }[];
	organization: {
		id: number;
		invoiceStripeSecretKey: string | null;
		invoiceStripePublishableKey: string | null;
		invoiceStripeWebhookSecret?: string | null;
		invoiceStripePaymentMethods: string | null;
	};
};

/**
 * Paiements Stripe des **factures clients** — utilise les clés Stripe **de l'organisation** (BDD).
 * Ne jamais utiliser les clés plateforme .env ici (réservées à l'abonnement PrestaFacture).
 */
@Injectable()
export class StripeService {
	private readonly logger = new Logger(StripeService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly payments: PaymentsService,
		private readonly secretsCrypto: SecretsCryptoService,
		private readonly installments: InvoiceInstallmentsService,
		private readonly installmentReleases: InvoiceInstallmentReleaseService,
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
						invoiceStripePaymentMethods: true,
					},
				},
			},
		});
		if (!invoice || !canAccessInvoiceByPublicToken(invoice)) {
			throw new NotFoundException('Facture introuvable');
		}
		if (!invoice.organization) {
			throw new ServiceUnavailableException('Organisation de la facture introuvable');
		}
		return invoice;
	}

	/**
	 * Solde encore dû (TTC − paiements nets − avoirs imputés).
	 * Prend en compte les remboursements COMPLETED pour permettre un re-paiement après refund.
	 *
	 * @param invoice - Facture avec paiements chargés
	 * @returns Montant restant en euros (arrondi centimes)
	 */
	private async getRemainingAmount(invoice: {
		id: string;
		total: unknown;
		payments: { amount: unknown }[];
	}): Promise<number> {
		const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
		const refundedAgg = await this.prisma.refund.aggregate({
			where: { invoiceId: invoice.id, status: 'COMPLETED' },
			_sum: { amount: true },
		});
		const totalRefunded = Number(refundedAgg._sum.amount ?? 0);
		const appliedCreditAgg = await this.prisma.avoirApplication.aggregate({
			where: { invoiceId: invoice.id },
			_sum: { amount: true },
		});
		const appliedCredit = Number(appliedCreditAgg._sum.amount ?? 0);
		const netPaid = totalPaid - totalRefunded;
		return Math.round((Number(invoice.total) - netPaid - appliedCredit) * 100) / 100;
	}

	/**
	 * Crée un PaymentIntent Stripe pour une facture déjà chargée (page publique ou API Bearer).
	 *
	 * @param invoice - Facture + organisation Stripe
	 * @param publicToken - Token public (métadonnées Stripe) ; généré si absent
	 * @returns clientSecret, montant et clé publishable
	 */
	private async createPaymentIntentForLoadedInvoice(
		invoice: InvoiceForStripePayment,
		publicToken: string,
	): Promise<PaymentIntentResponse> {
		const org = invoice.organization;
		const stripe = this.getOrgStripeClient(org);
		const { publishableKey } = this.resolveOrgStripe(org);
		if (!publishableKey) {
			throw new ServiceUnavailableException('Clé publishable Stripe prestataire manquante');
		}
		const remaining = await this.getRemainingAmount(invoice);

		if (remaining <= 0) {
			throw new BadRequestException('Cette facture est déjà réglée');
		}

		await this.installmentReleases.ensurePayableInstallment(invoice.id);

		const online = await this.installments.resolveOnlinePaymentAmount(invoice.id, remaining);
		const chargeAmount = online.amount;
		if (chargeAmount <= 0) {
			throw new BadRequestException('Aucune échéance à régler pour le moment');
		}

		let installmentSequence: number | null = null;
		if (online.installmentId != null) {
			const row = await this.prisma.invoiceInstallment.findUnique({
				where: { id: online.installmentId },
				select: { sequence: true },
			});
			installmentSequence = row?.sequence ?? null;
		}

		const amountCents = Math.round(chargeAmount * 100);
		const currency = (invoice.currency || 'EUR').toLowerCase();
		const configuredMethods = parseInvoiceStripePaymentMethodsStored(org.invoiceStripePaymentMethods);
		const paymentMethodTypes = ensureInvoicePaymentMethodTypes(
			filterBnplPaymentMethodsForAmount(configuredMethods, chargeAmount, currency),
		);
		const bnplMethods = resolveActiveBnplPaymentMethods(configuredMethods, chargeAmount, currency);

		const paymentIntent = await stripe.paymentIntents.create({
			amount: amountCents,
			currency,
			metadata: {
				invoiceId: String(invoice.id),
				organizationId: String(org.id),
				publicToken,
				invoiceNumber: invoice.number,
				...(online.installmentId != null
					? { installmentId: String(online.installmentId) }
					: {}),
			},
			payment_method_types: paymentMethodTypes,
		});

		if (!paymentIntent.client_secret) {
			throw new ServiceUnavailableException('Impossible de créer le paiement Stripe');
		}

		return {
			clientSecret: paymentIntent.client_secret,
			amount: chargeAmount,
			currency: invoice.currency || 'EUR',
			stripePublishableKey: publishableKey,
			bnplMethods,
			installmentId: online.installmentId,
			installmentSequence,
			paymentIntentId: paymentIntent.id,
		};
	}

	/**
	 * PaymentIntent via token public (page client /facture/:token).
	 *
	 * @param token - publicToken de la facture
	 */
	async createPaymentIntentForInvoice(token: string): Promise<PaymentIntentResponse> {
		const safeToken = assertValidPublicToken(token);
		const invoice = await this.getInvoiceByPublicToken(safeToken);
		return this.createPaymentIntentForLoadedInvoice(
			invoice as InvoiceForStripePayment,
			safeToken,
		);
	}

	/**
	 * PaymentIntent via API Bearer : crée (ou réutilise) un publicToken, passe en SENT si brouillon.
	 *
	 * @param invoiceId - ID facture
	 * @param organizationId - Organisation du jeton API
	 * @returns clientSecret + publishable key pour Stripe.js côté intégrateur
	 * @throws {NotFoundException} Facture hors org
	 * @throws {BadRequestException} Facture annulée ou déjà payée
	 */
	async createPaymentIntentForInvoiceId(
		invoiceId: string,
		organizationId: number,
	): Promise<PaymentIntentResponse & { invoiceId: string; publicToken: string }> {
		const invoice = await this.prisma.invoice.findFirst({
			where: { id: invoiceId, organizationId },
			include: {
				payments: true,
				organization: {
					select: {
						id: true,
						invoiceStripeSecretKey: true,
						invoiceStripePublishableKey: true,
						invoiceStripeWebhookSecret: true,
						invoiceStripePaymentMethods: true,
					},
				},
			},
		});
		if (!invoice?.organization) {
			throw new NotFoundException('Facture introuvable');
		}
		if (invoice.status === 'CANCELLED') {
			throw new BadRequestException('Impossible de payer une facture annulée');
		}

		let publicToken = invoice.publicToken;
		const needsToken = !publicToken;
		const needsSent = !invoice.sentAt && invoice.status === 'DRAFT';
		if (needsToken || needsSent) {
			publicToken = publicToken ?? randomBytes(32).toString('hex');
			await this.prisma.invoice.update({
				where: { id: invoice.id },
				data: {
					publicToken,
					...(needsSent ? { status: 'SENT', sentAt: new Date() } : {}),
				},
			});
		}

		const result = await this.createPaymentIntentForLoadedInvoice(
			{ ...invoice, publicToken, organization: invoice.organization },
			publicToken!,
		);
		return { ...result, invoiceId: invoice.id, publicToken: publicToken! };
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

	/**
	 * Confirme un PaymentIntent pour une facture (API Bearer) et enregistre le paiement local.
	 *
	 * @param invoiceId - ID facture
	 * @param organizationId - Organisation du jeton
	 * @param paymentIntentId - ID Stripe `pi_…`
	 */
	async confirmPaymentIntentForInvoiceId(
		invoiceId: string,
		organizationId: number,
		paymentIntentId: string,
	): Promise<{ ok: boolean; invoiceId: string }> {
		const invoice = await this.prisma.invoice.findFirst({
			where: { id: invoiceId, organizationId },
			include: {
				organization: {
					select: {
						id: true,
						invoiceStripeSecretKey: true,
						invoiceStripePublishableKey: true,
					},
				},
			},
		});
		if (!invoice?.organization) {
			throw new NotFoundException('Facture introuvable');
		}
		const stripe = this.getOrgStripeClient(invoice.organization);
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

		return { ok: true, invoiceId };
	}

	/**
	 * Enregistre le paiement local après succès Stripe (idempotent via notes `stripe:pi_…`).
	 *
	 * @param paymentIntent - Payload PaymentIntent (webhook ou confirm)
	 */
	async fulfillPaymentIntent(paymentIntent: StripePaymentIntentPayload): Promise<void> {
		const invoiceId = paymentIntent.metadata?.invoiceId?.trim();
		if (!invoiceId) {
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

		const remaining = await this.getRemainingAmount(invoice);
		const paidAmount = Math.round((paymentIntent.amount_received / 100) * 100) / 100;
		const amount = Math.min(paidAmount, remaining);

		if (amount <= 0) return;

		await this.payments.create({
			invoiceId,
			amount,
			method: 'STRIPE',
			notes: stripeRef,
		});
		await this.installmentReleases.ensurePayableInstallment(invoiceId);
	}

	/**
	 * Remboursement Stripe sur un PaymentIntent encaissé.
	 * Vérifie d'abord les refunds Stripe existants pour éviter un double remboursement.
	 *
	 * @param organizationId - Organisation (clés Stripe prestataire)
	 * @param paymentIntentId - ID `pi_…`
	 * @param amountEur - Montant en euros
	 * @param options.idempotencyKey - Clé d'idempotence Stripe (recommandée côté API)
	 * @returns Identifiant `re_…` et flag si le refund existait déjà côté Stripe
	 * @throws {ConflictException} Si le PI est déjà entièrement remboursé sur Stripe
	 * @throws {BadRequestException} Si le montant dépasse le remboursable Stripe
	 */
	async refundPaymentIntent(
		organizationId: number,
		paymentIntentId: string,
		amountEur: number,
		options?: { idempotencyKey?: string },
	): Promise<StripeRefundResult> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: {
				invoiceStripeSecretKey: true,
				invoiceStripePublishableKey: true,
			},
		});
		if (!org) throw new NotFoundException('Organisation introuvable');
		const stripe = this.getOrgStripeClient(org);
		const amountCents = Math.round(amountEur * 100);
		if (amountCents <= 0) {
			throw new BadRequestException('Montant de remboursement invalide');
		}

		const listed = await stripe.refunds.list({
			payment_intent: paymentIntentId,
			limit: 100,
		});
		const activeRefunds = listed.data.filter(
			(r) => r.status === 'succeeded' || r.status === 'pending',
		);
		const alreadyRefundedCents = activeRefunds.reduce((sum, r) => sum + r.amount, 0);

		const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
		const chargedCents = paymentIntent.amount_received || paymentIntent.amount || 0;
		const remainingCents = chargedCents - alreadyRefundedCents;

		if (remainingCents <= 0) {
			const last = activeRefunds[0];
			if (last) {
				return { refundId: last.id, alreadyRefunded: true };
			}
			throw new ConflictException(
				'Ce paiement est déjà entièrement remboursé côté Stripe.',
			);
		}

		if (amountCents > remainingCents) {
			throw new BadRequestException(
				`Montant supérieur au remboursable Stripe (${(remainingCents / 100).toFixed(2)} € restants).`,
			);
		}

		const createOpts = options?.idempotencyKey
			? { idempotencyKey: options.idempotencyKey }
			: undefined;

		try {
			const refund = await stripe.refunds.create(
				{
					payment_intent: paymentIntentId,
					amount: amountCents,
				},
				createOpts,
			);
			return { refundId: refund.id, alreadyRefunded: false };
		} catch (err) {
			const code = (err as { code?: string })?.code;
			if (code === 'charge_already_refunded') {
				const again = await stripe.refunds.list({
					payment_intent: paymentIntentId,
					limit: 100,
				});
				const last = again.data.find(
					(r) => r.status === 'succeeded' || r.status === 'pending',
				);
				if (last) {
					return { refundId: last.id, alreadyRefunded: true };
				}
				throw new ConflictException(
					'Ce paiement est déjà remboursé côté Stripe.',
				);
			}
			throw err;
		}
	}
}
