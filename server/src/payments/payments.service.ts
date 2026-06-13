import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { InvoicePaymentNotificationService } from '../invoices/invoice-payment-notification.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { notifyLinkedRemainderAfterDepositPaid } from '../invoices/invoice-deposit-realtime.util';
import { syncClientStatusFromActivity } from '../clients/client-status.util';
import { InvoiceInstallmentsService } from '../invoices/invoice-installments.service';
import { InvoiceInstallmentReleaseService } from '../invoices/invoice-installment-release.service';

/**
 * Données de création de paiement
 */
export interface CreatePaymentDto {
	/** ID de la facture */
	invoiceId: string;
	/** Montant du paiement */
	amount: number;
	/** Date du paiement (optionnel) */
	date?: string | Date;
	/** Méthode de paiement (optionnel) */
	method?: string;
	/** Notes (optionnel) */
	notes?: string;
}

/**
 * Données de mise à jour de paiement
 */
export interface UpdatePaymentDto {
	/** Montant du paiement */
	amount?: number;
	/** Date du paiement */
	date?: string | Date;
	/** Méthode de paiement */
	method?: string;
	/** Notes */
	notes?: string;
}

/**
 * Service de gestion des paiements
 * 
 * Gère :
 * - La création de paiements sur factures
 * - La mise à jour du solde et statut des factures
 * - La comptabilisation automatique (écritures 512/411)
 * - La validation des montants (ne peut pas dépasser le total)
 * 
 * @see PaymentsController pour les endpoints API
 */
@Injectable()
export class PaymentsService {
	private readonly logger = new Logger(PaymentsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly accounting: AccountingService,
		private readonly paidNotifications: InvoicePaymentNotificationService,
		private readonly realtime: RealtimeEventsService,
		private readonly installments: InvoiceInstallmentsService,
		private readonly installmentReleases: InvoiceInstallmentReleaseService,
	) {}

	async create(data: CreatePaymentDto, organizationId?: number) {
		const invoice = await this.prisma.invoice.findFirst({
			where: { id: data.invoiceId, ...(organizationId != null ? { organizationId } : {}) },
			include: { payments: true }
		});
		if (!invoice) {
			throw new NotFoundException('Facture non trouvee');
		}

		const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
		const refundedAgg = await this.prisma.refund.aggregate({
			where: { invoiceId: data.invoiceId, status: 'COMPLETED' },
			_sum: { amount: true },
		});
		const totalRefunded = Number(refundedAgg._sum.amount ?? 0);
		const invoiceTotal = Number(invoice.total);
		const appliedCreditAgg = await this.prisma.avoirApplication.aggregate({
			where: { invoiceId: data.invoiceId },
			_sum: { amount: true },
		});
		const appliedCredit = Number(appliedCreditAgg._sum.amount ?? 0);
		const remaining = Math.max(0, invoiceTotal - (totalPaid - totalRefunded) - appliedCredit);
		const wasFullyPaid = invoice.status === 'PAID' || remaining <= 0;

		if (data.amount > remaining + 0.01) {
			throw new BadRequestException(`Le montant du paiement (${data.amount}) depasse le solde restant (${remaining})`);
		}

		const payment = await this.prisma.payment.create({
			data: {
				invoiceId: data.invoiceId,
				amount: data.amount,
				date: data.date ? new Date(data.date) : new Date(),
				method: data.method,
				notes: data.notes
			}
		});

		await this.installments.allocatePayment(data.invoiceId, payment.id, data.amount);
		await this.installmentReleases.ensurePayableInstallment(data.invoiceId);

		// Mettre à jour le solde de la facture (TTC − encaissements − avoirs imputés)
		const newTotalPaid = totalPaid + data.amount;
		const newBalance = Math.max(0, Number((invoiceTotal - newTotalPaid + totalRefunded - appliedCredit).toFixed(2)));
		const newStatus = newBalance <= 0.01 ? 'PAID' : invoice.status;

		await this.prisma.invoice.update({
			where: { id: data.invoiceId },
			data: {
				balance: newBalance,
				status: newStatus
			}
		});

		// Comptabilisation de l'encaissement
		try {
			await this.accounting.postInvoicePayment({
				invoiceId: data.invoiceId,
				amount: data.amount,
				paymentId: payment.id,
				date: payment.date
			});
		} catch (_) {}

		if (newStatus === 'PAID' && !wasFullyPaid) {
			this.paidNotifications
				.notifyInvoiceFullyPaid(data.invoiceId, {
					lastPaymentAmount: data.amount,
					paymentMethod: data.method,
				})
				.catch((err) =>
					this.logger.warn(
						`Notification paiement facture ${data.invoiceId}: ${(err as Error).message}`,
					),
				);
			void syncClientStatusFromActivity(this.prisma, invoice.clientId);
		}

		const realtimeOrgId = organizationId ?? invoice.organizationId ?? undefined;
		if (realtimeOrgId) {
			this.realtime.emit(
				realtimeOrgId,
				'invoices',
				newStatus === 'PAID' && !wasFullyPaid ? 'paid' : 'updated',
				data.invoiceId,
				{ number: invoice.number, status: newStatus },
			);
			if (newStatus === 'PAID' && !wasFullyPaid) {
				void notifyLinkedRemainderAfterDepositPaid(this.prisma, this.realtime, invoice);
			}
		}

		return {
			...payment,
			amount: Number(payment.amount)
		};
	}

	async findAll(invoiceId?: string, organizationId?: number) {
		const where: any = {};
		if (invoiceId) where.invoiceId = invoiceId;
		if (organizationId != null) where.invoice = { organizationId };
		const payments = await this.prisma.payment.findMany({
			where,
			include: { invoice: { include: { client: true } } },
			orderBy: { date: 'desc' }
		});

		return payments.map((p) => ({
			...p,
			amount: Number(p.amount)
		}));
	}

	async findOne(id: number, organizationId?: number) {
		const payment = await this.prisma.payment.findUnique({
			where: { id },
			include: { invoice: { include: { client: true } } }
		});
		if (!payment) {
			throw new NotFoundException('Paiement non trouve');
		}
		if (organizationId != null && (payment.invoice as any)?.organizationId !== organizationId) {
			throw new NotFoundException('Paiement non trouve');
		}
		return {
			...payment,
			amount: Number(payment.amount)
		};
	}

	async update(id: number, data: UpdatePaymentDto, organizationId?: number) {
		const payment = await this.findOne(id, organizationId);
		const invoice = await this.prisma.invoice.findUnique({
			where: { id: payment.invoiceId },
			include: { payments: true }
		});

		if (!invoice) {
			throw new NotFoundException('Facture non trouvee');
		}

		// Recalculer le solde si le montant change
		if (data.amount !== undefined) {
			const otherPayments = invoice.payments.filter((p) => p.id !== id);
			const totalOtherPaid = otherPayments.reduce((sum, p) => sum + Number(p.amount), 0);
			const invoiceTotal = Number(invoice.total);
			const newTotalPaid = totalOtherPaid + data.amount;
			const newBalance = invoiceTotal - newTotalPaid;

			if (newBalance < 0) {
				throw new BadRequestException('Le montant du paiement depasse le total de la facture');
			}

			const newStatus = newBalance <= 0 ? 'PAID' : invoice.status;

			await this.prisma.invoice.update({
				where: { id: payment.invoiceId },
				data: {
					balance: newBalance,
					status: newStatus
				}
			});
		}

		const updated = await this.prisma.payment.update({
			where: { id },
			data: {
				amount: data.amount,
				date: data.date ? new Date(data.date) : undefined,
				method: data.method,
				notes: data.notes
			},
			include: { invoice: { include: { client: true } } }
		});

		return {
			...updated,
			amount: Number(updated.amount)
		};
	}

	async remove(id: number, organizationId?: number) {
		const payment = await this.findOne(id, organizationId);
		const invoice = await this.prisma.invoice.findUnique({
			where: { id: payment.invoiceId },
			include: { payments: true }
		});

		if (!invoice) {
			throw new NotFoundException('Facture non trouvee');
		}

		await this.prisma.payment.delete({ where: { id } });

		// Recalculer le solde de la facture
		const remainingPayments = invoice.payments.filter((p) => p.id !== id);
		const totalPaid = remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
		const invoiceTotal = Number(invoice.total);
		const newBalance = invoiceTotal - totalPaid;
		const newStatus = newBalance <= 0 ? 'PAID' : invoice.status === 'PAID' && newBalance > 0 ? 'SENT' : invoice.status;

		await this.prisma.invoice.update({
			where: { id: payment.invoiceId },
			data: {
				balance: newBalance,
				status: newStatus
			}
		});

		return { success: true };
	}
}




