import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
	ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { AvoirsService } from '../avoirs/avoirs.service';
import { EmailService } from '../common/email.service';
import { StripeService } from '../stripe/stripe.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { parseTagsJson, serializeTagsJson } from '../common/document-folder.util';
import {
	parseQuoteIdFromSplitTags,
} from '../invoices/invoice-deposit.util';
import { CreateRefundDto } from './dto/create-refund.dto';

export interface RefundSummary {
	id: number;
	invoiceId: string;
	paymentId: number | null;
	amount: number;
	date: Date;
	method: string | null;
	reason: string | null;
	notes: string | null;
	stripeRefundId: string | null;
	status: string;
	createdAt: Date;
}

@Injectable()
export class RefundsService {
	private readonly logger = new Logger(RefundsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly accounting: AccountingService,
		private readonly avoirs: AvoirsService,
		private readonly email: EmailService,
		private readonly stripe: StripeService,
		private readonly realtime: RealtimeEventsService,
	) {}

	private formatRefund(r: {
		id: number;
		invoiceId: string;
		paymentId: number | null;
		amount: unknown;
		date: Date;
		method: string | null;
		reason: string | null;
		notes: string | null;
		stripeRefundId: string | null;
		status: string;
		createdAt: Date;
	}): RefundSummary {
		return {
			...r,
			amount: Number(r.amount),
		};
	}

	async sumRefundedOnPayment(paymentId: number): Promise<number> {
		const rows = await this.prisma.refund.findMany({
			where: { paymentId, status: 'COMPLETED' },
		});
		return rows.reduce((s, r) => s + Number(r.amount), 0);
	}

	async getRefundableOnPayment(paymentId: number): Promise<number> {
		const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
		if (!payment) return 0;
		const refunded = await this.sumRefundedOnPayment(paymentId);
		return Math.max(0, Number(payment.amount) - refunded);
	}

	private async recalcInvoiceBalance(invoiceId: string): Promise<{ balance: number; status: string }> {
		const invoice = await this.prisma.invoice.findUnique({
			where: { id: invoiceId },
			include: { payments: true, refunds: { where: { status: 'COMPLETED' } } },
		});
		if (!invoice) throw new NotFoundException('Facture introuvable');

		const total = Number(invoice.total);
		const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
		const refunded = invoice.refunds.reduce((s, r) => s + Number(r.amount), 0);
		const netPaid = paid - refunded;
		const appliedCreditAgg = await this.prisma.avoirApplication.aggregate({
			where: { invoiceId },
			_sum: { amount: true },
		});
		const appliedCredit = Number(appliedCreditAgg._sum.amount ?? 0);
		const balance = Math.max(0, Number((total - netPaid - appliedCredit).toFixed(2)));

		let status = invoice.status;
		if (balance <= 0 && netPaid >= total - 0.01) {
			status = 'PAID';
		} else if (balance > 0 && invoice.status === 'PAID') {
			status = 'SENT';
		}

		await this.prisma.invoice.update({
			where: { id: invoiceId },
			data: { balance, status },
		});

		return { balance, status };
	}

	private parseStripePaymentIntentId(notes: string | null | undefined): string | null {
		const ref = notes?.trim();
		if (!ref?.startsWith('stripe:')) return null;
		return ref.slice('stripe:'.length) || null;
	}

	async createForInvoice(
		invoiceId: string,
		dto: CreateRefundDto,
		organizationId: number,
	): Promise<RefundSummary> {
		const invoice = await this.prisma.invoice.findFirst({
			where: { id: invoiceId, organizationId },
			include: {
				payments: true,
				client: true,
				organization: {
					select: {
						id: true,
						name: true,
						legalName: true,
					},
				},
			},
		});
		if (!invoice) throw new NotFoundException('Facture introuvable');
		if (invoice.status === 'CANCELLED') {
			throw new BadRequestException('Impossible de rembourser une facture annulée');
		}

		const amount = Number(dto.amount);
		if (amount <= 0) throw new BadRequestException('Montant invalide');

		let payment: { id: number; amount: unknown; notes: string | null; method: string | null } | null = null;
		if (dto.paymentId != null) {
			payment = await this.prisma.payment.findFirst({
				where: { id: dto.paymentId, invoiceId },
			});
			if (!payment) throw new NotFoundException('Paiement introuvable sur cette facture');
			const refundable = await this.getRefundableOnPayment(payment.id);
			if (amount > refundable + 0.01) {
				throw new BadRequestException(
					`Montant supérieur au remboursable sur ce paiement (${refundable.toFixed(2)} €)`,
				);
			}
		} else {
			const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
			const refunded = await this.prisma.refund.aggregate({
				where: { invoiceId, status: 'COMPLETED' },
				_sum: { amount: true },
			});
			const netPaid = paid - Number(refunded._sum.amount ?? 0);
			if (amount > netPaid + 0.01) {
				throw new BadRequestException(
					`Montant supérieur au net encaissé remboursable (${netPaid.toFixed(2)} €)`,
				);
			}
		}

		let stripeRefundId: string | null = null;
		let status: 'PENDING' | 'COMPLETED' | 'FAILED' = 'COMPLETED';

		if (dto.refundViaStripe && payment) {
			const piId = this.parseStripePaymentIntentId(payment.notes);
			if (!piId) {
				throw new BadRequestException(
					'Ce paiement n\'est pas lié à Stripe — désactivez refundViaStripe ou remboursez manuellement.',
				);
			}
			try {
				stripeRefundId = await this.stripe.refundPaymentIntent(organizationId, piId, amount);
			} catch (err) {
				this.logger.warn(`Stripe refund failed: ${(err as Error).message}`);
				throw new ServiceUnavailableException(
					`Remboursement Stripe impossible : ${(err as Error).message}`,
				);
			}
		}

		const refund = await this.prisma.refund.create({
			data: {
				invoiceId,
				paymentId: dto.paymentId ?? null,
				organizationId,
				amount,
				date: dto.date ? new Date(dto.date) : new Date(),
				method: dto.method ?? payment?.method ?? null,
				reason: dto.reason,
				notes: dto.notes,
				stripeRefundId,
				status,
			},
		});

		const { balance, status: invoiceStatus } = await this.recalcInvoiceBalance(invoiceId);

		try {
			await this.accounting.postInvoiceRefund({
				invoiceId,
				amount,
				refundId: refund.id,
				date: refund.date,
			});
		} catch (err) {
			this.logger.warn(`Compta remboursement ${refund.id}: ${(err as Error).message}`);
		}

		// Notification client (une fois par remboursement).
		try {
			const clientEmail = invoice.client?.email?.trim();
			if (clientEmail) {
				const type = `invoice_refund_notified:${refund.id}`;
				const exists = await this.prisma.emailEvent.findFirst({
					where: { invoiceId, type },
				});
				if (!exists) {
					const issuerName = invoice.organization?.legalName?.trim()
						? invoice.organization.legalName
						: invoice.organization?.name?.trim()
							? invoice.organization.name
							: 'Votre prestataire';

					const clientName =
						(invoice.client as any)?.companyName?.trim?.() ||
						invoice.client?.name?.trim() ||
						'Client';

					await this.email.sendInvoiceRefundedToClient({
						to: clientEmail,
						clientName,
						invoiceNumber: invoice.number,
						invoiceDate: invoice.date,
						refundedAmount: amount,
						refundReason: dto.reason ?? null,
						issuerName,
					});

					await this.prisma.emailEvent.create({
						data: {
							invoiceId,
							type,
							meta: { refundId: refund.id },
						},
					});
				}
			}
		} catch (err) {
			this.logger.warn(`Email remboursement ${refund.id}: ${(err as Error).message}`);
		}

		this.realtime.emit(organizationId, 'invoices', 'updated', invoiceId, {
			number: invoice.number,
			status: invoiceStatus,
		});

		return this.formatRefund(refund);
	}

	async createForPayment(
		paymentId: number,
		dto: CreateRefundDto,
		organizationId: number,
	): Promise<RefundSummary> {
		const payment = await this.prisma.payment.findUnique({
			where: { id: paymentId },
			include: { invoice: true },
		});
		if (!payment?.invoice) throw new NotFoundException('Paiement introuvable');
		if (payment.invoice.organizationId !== organizationId) {
			throw new NotFoundException('Paiement introuvable');
		}
		return this.createForInvoice(
			payment.invoiceId,
			{ ...dto, paymentId },
			organizationId,
		);
	}

	async findAll(
		organizationId: number,
		query?: { start?: string; end?: string; page?: number; pageSize?: number },
	) {
		const page = Math.max(1, query?.page ?? 1);
		const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 25));
		const skip = (page - 1) * pageSize;
		const where: {
			organizationId: number;
			status: 'COMPLETED';
			date?: { gte?: Date; lte?: Date };
		} = { organizationId, status: 'COMPLETED' };
		if (query?.start || query?.end) {
			where.date = {};
			if (query.start) where.date.gte = new Date(query.start);
			if (query.end) {
				const endDate = new Date(query.end);
				endDate.setHours(23, 59, 59, 999);
				where.date.lte = endDate;
			}
		}

		const [rows, total] = await Promise.all([
			this.prisma.refund.findMany({
				where,
				skip,
				take: pageSize,
				orderBy: { date: 'desc' },
				include: {
					invoice: { select: { id: true, number: true, client: { select: { name: true } } } },
					payment: { select: { id: true, method: true } },
				},
			}),
			this.prisma.refund.count({ where }),
		]);

		return {
			data: rows.map((r) => ({
				...this.formatRefund(r),
				invoiceNumber: r.invoice?.number,
				invoiceId: r.invoiceId,
				clientName: r.invoice?.client?.name,
				paymentMethod: r.payment?.method,
			})),
			pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
		};
	}

	async findByInvoice(invoiceId: string, organizationId: number): Promise<RefundSummary[]> {
		const invoice = await this.prisma.invoice.findFirst({
			where: { id: invoiceId, organizationId },
		});
		if (!invoice) throw new NotFoundException('Facture introuvable');

		const rows = await this.prisma.refund.findMany({
			where: { invoiceId },
			orderBy: { date: 'desc' },
		});
		return rows.map((r) => this.formatRefund(r));
	}

	/**
	 * Annule un contrat d'engagement après paiement de l'acompte :
	 * rembourse les encaissements, émet un avoir sur l'acompte, annule la facture de solde.
	 */
	async cancelDepositEngagement(
		depositInvoiceId: string,
		organizationId: number,
		options?: { reason?: string; refundViaStripe?: boolean; creditOnly?: boolean },
	) {
		const deposit = await this.prisma.invoice.findFirst({
			where: { id: depositInvoiceId, organizationId },
			include: {
				payments: true,
				lines: true,
				client: true,
			},
		});
		if (!deposit) throw new NotFoundException('Facture introuvable');

		const tags = parseTagsJson(deposit.tags);
		if (!tags.includes('ACOMPTE_10')) {
			throw new BadRequestException(
				'Cette action concerne uniquement une facture d\'acompte (tag ACOMPTE_10).',
			);
		}
		if (tags.includes('ACOMPTE_REFUNDED')) {
			throw new BadRequestException('L\'acompte a déjà été remboursé / le contrat est annulé.');
		}

		const quoteId = parseQuoteIdFromSplitTags(tags);
		const remainderTag = quoteId ? `SOLDE_APRES_ACOMPTE_OF:${quoteId}` : null;
		const remainder = remainderTag
			? await this.prisma.invoice.findFirst({
					where: {
						organizationId,
						tags: { contains: `"${remainderTag}"` },
					},
					include: { payments: true, lines: true, client: true },
				})
			: null;

		let remainderNetPaid = 0;
		if (remainder) {
			const remPaid = remainder.payments.reduce((s, p) => s + Number(p.amount), 0);
			const remRefundedAgg = await this.prisma.refund.aggregate({
				where: { invoiceId: remainder.id, status: 'COMPLETED' },
				_sum: { amount: true },
			});
			const remRefunded = Number(remRefundedAgg._sum.amount ?? 0);
			remainderNetPaid = remPaid - remRefunded;

			if (remainder.status !== 'CANCELLED') {
				const remTags = serializeTagsJson([
					...parseTagsJson(remainder.tags),
					'ENGAGEMENT_CANCELLED',
				]);
				await this.prisma.invoice.update({
					where: { id: remainder.id },
					data: {
						status: 'CANCELLED',
						tags: remTags,
						balance: 0,
					},
				});
			}
		}

		const payments = deposit.payments;
		if (payments.length === 0) {
			throw new BadRequestException('Aucun paiement enregistré sur cette facture d\'acompte.');
		}

		const refunds: RefundSummary[] = [];
		if (!options?.creditOnly) {
			for (const payment of payments) {
				const refundable = await this.getRefundableOnPayment(payment.id);
				if (refundable <= 0) continue;
				const r = await this.createForInvoice(
					deposit.id,
					{
						amount: refundable,
						paymentId: payment.id,
						reason: options?.reason ?? 'Annulation contrat d\'engagement — remboursement acompte',
						refundViaStripe: options?.refundViaStripe ?? false,
					},
					organizationId,
				);
				refunds.push(r);
			}
		}

		const defaultTaxRate = await this.getDefaultTaxRate();
		const avoirLines = deposit.lines.map((l) => ({
			description: `Avoir — ${l.description}`,
			quantity: l.quantity,
			unitPrice: Number(l.unitPrice),
			taxRate: Number(l.taxRate),
		}));

		const avoir = await this.avoirs.create(
			{
				clientId: deposit.clientId,
				// Si creditOnly : avoir non lié à une facture (crédit client imputable sur une future facture).
				...(options?.creditOnly ? {} : { invoiceId: deposit.id }),
				status: 'SENT',
				memo: options?.creditOnly
					? options?.reason ?? 'Annulation contrat — crédit client (avoir)'
					: options?.reason ?? 'Annulation contrat — avoir sur acompte',
				lines: avoirLines.length > 0 ? avoirLines : [
					{
						description: `Avoir acompte ${deposit.number}`,
						quantity: 1,
						unitPrice: Number(deposit.subtotal),
						taxRate: defaultTaxRate,
					},
				],
			},
			organizationId,
		);

		// Si on rembourse réellement, on peut imputer l’avoir sur la facture d’acompte (soldeable).
		// Si creditOnly, l’avoir doit rester disponible pour une facture future => pas d’imputation ici.
		if (!options?.creditOnly) {
			// Pour l’annulation d’un contrat d’engagement, on annule la totalité de la facture d’acompte
			// via l’avoir (même si l’acompte n’a été payé que partiellement).
			const depositAfterAvoir = await this.prisma.invoice.findUnique({ where: { id: deposit.id } });
			const remainingBalance = Number(depositAfterAvoir?.balance ?? 0);
			if (remainingBalance > 0.01) {
				const avoirTotal = Number(avoir.total);
				const applyAmount = Math.min(avoirTotal, remainingBalance);
				if (applyAmount > 0.01) {
					await this.avoirs.apply(
						avoir.id,
						{ invoiceId: deposit.id, amount: applyAmount },
						organizationId,
					);
				}
			}
		}

		let remainderAvoir: Awaited<ReturnType<AvoirsService['create']>> | null = null;
		if (remainder && remainderNetPaid > 0.01) {
			const remainderAvoirLines = remainder.lines.map((l) => ({
				description: `Avoir — ${l.description}`,
				quantity: l.quantity,
				unitPrice: Number(l.unitPrice),
				taxRate: Number(l.taxRate),
			}));
			remainderAvoir = await this.avoirs.create(
				{
					clientId: remainder.clientId,
					invoiceId: remainder.id,
					status: 'SENT',
					memo: options?.reason ?? 'Annulation contrat — avoir sur solde déjà encaissé',
					lines:
						remainderAvoirLines.length > 0
							? remainderAvoirLines
							: [
									{
										description: `Avoir solde ${remainder.number}`,
										quantity: 1,
										unitPrice: Number(remainder.subtotal),
										taxRate: defaultTaxRate,
									},
							  ],
				},
				organizationId,
			);
			if (!options?.creditOnly) {
				const remainderAfterAvoir = await this.prisma.invoice.findUnique({ where: { id: remainder.id } });
				const remainingBalance = Number(remainderAfterAvoir?.balance ?? 0);
				if (remainingBalance > 0.01) {
					const applyAmount = Math.min(Number(remainderAvoir.total), remainingBalance);
					if (applyAmount > 0.01) {
						await this.avoirs.apply(
							remainderAvoir.id,
							{ invoiceId: remainder.id, amount: applyAmount },
							organizationId,
						);
					}
				}
			}
		}

		const depositTags = serializeTagsJson([
			...tags,
			'ENGAGEMENT_CANCELLED',
			...(options?.creditOnly ? ['ACOMPTE_CREDITED'] : ['ACOMPTE_REFUNDED']),
		]);
		await this.prisma.invoice.update({
			where: { id: deposit.id },
			// Si creditOnly : on ne “cancelle” pas la facture payée (sinon incohérence historique),
			// on la marque comme contrat annulé + crédit émis.
			data: { tags: depositTags, ...(options?.creditOnly ? {} : { status: 'CANCELLED' }) },
		});

		this.realtime.emit(organizationId, 'invoices', 'updated', deposit.id, {
			number: deposit.number,
			status: options?.creditOnly ? deposit.status : 'CANCELLED',
		});

		return {
			depositInvoiceId: deposit.id,
			depositNumber: deposit.number,
			remainderInvoiceId: remainder?.id ?? null,
			remainderNumber: remainder?.number ?? null,
			remainderAvoir,
			refunds,
			avoir,
		};
	}

	private async getDefaultTaxRate(): Promise<number> {
		const def = await this.prisma.taxRate.findFirst({ where: { isDefault: true } });
		if (!def) return 0.2;
		return Number(def.rate) || 0.2;
	}
}
