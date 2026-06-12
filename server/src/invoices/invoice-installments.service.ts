import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
	assertValidInstallmentSchedule,
	buildEqualInstallmentSchedule,
	type InvoiceInstallmentDto,
	type InvoiceInstallmentInput,
	isInstallmentOverdue,
	resolveInstallmentsCoveredByPayment,
	resolveOnlineInstallmentAmount,
} from './invoice-installment.util';
import {
	buildInvoiceInstallmentSummary,
	type InvoiceInstallmentSummary,
} from './invoice-installment-summary.util';

/**
 * Gestion des échéanciers de paiement métier sur les factures (B2B).
 * Distinct du BNPL Stripe (Klarna/Alma) : le prestataire définit le plan, le client paie échéance par échéance.
 */
@Injectable()
export class InvoiceInstallmentsService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Liste les échéances d'une facture.
	 *
	 * @param invoiceId - ID facture
	 * @param organizationId - Filtre multi-tenant optionnel
	 */
	async listForInvoice(invoiceId: string, organizationId?: number): Promise<InvoiceInstallmentDto[]> {
		await this.assertInvoiceAccess(invoiceId, organizationId);
		const rows = await this.prisma.invoiceInstallment.findMany({
			where: { invoiceId },
			orderBy: { sequence: 'asc' },
		});
		return rows.map((row) => this.toDto(row));
	}

	/**
	 * Définit ou remplace l'échéancier d'une facture.
	 *
	 * @param invoiceId - ID facture
	 * @param installments - Échéances (somme = total TTC)
	 * @param organizationId - Organisation propriétaire
	 */
	async setSchedule(
		invoiceId: string,
		installments: InvoiceInstallmentInput[],
		organizationId?: number,
	): Promise<InvoiceInstallmentDto[]> {
		const invoice = await this.assertInvoiceAccess(invoiceId, organizationId, {
			includePayments: true,
			includeInstallments: true,
		});

		if (invoice.status === 'CANCELLED' || invoice.status === 'PAID') {
			throw new BadRequestException('Impossible de modifier l’échéancier sur cette facture');
		}
		if ((invoice.payments?.length ?? 0) > 0) {
			throw new BadRequestException(
				'Impossible de modifier l’échéancier après le premier encaissement',
			);
		}
		const paidCount = (invoice.installments ?? []).filter((i) => i.status === 'PAID').length;
		if (paidCount > 0) {
			throw new BadRequestException('Des échéances sont déjà réglées');
		}

		const total = Number(invoice.total);
		try {
			assertValidInstallmentSchedule(installments, total);
		} catch (err) {
			throw new BadRequestException((err as Error).message);
		}

		await this.prisma.$transaction([
			this.prisma.invoiceInstallment.deleteMany({ where: { invoiceId } }),
			...installments.map((row, index) =>
				this.prisma.invoiceInstallment.create({
					data: {
						invoiceId,
						sequence: index + 1,
						amount: row.amount,
						dueDate: new Date(row.dueDate),
						status: 'PENDING',
					},
				}),
			),
		]);

		return this.listForInvoice(invoiceId, organizationId);
	}

	/**
	 * Propose un échéancier en parts égales (prévisualisation / aide UI).
	 *
	 * @param total - Total TTC
	 * @param count - Nombre d'échéances
	 * @param firstDueDate - Première échéance
	 * @param intervalMonths - Intervalle en mois
	 */
	previewEqualSchedule(
		total: number,
		count: number,
		firstDueDate: string | Date,
		intervalMonths = 1,
	): InvoiceInstallmentInput[] {
		try {
			return buildEqualInstallmentSchedule(total, count, new Date(firstDueDate), intervalMonths);
		} catch (err) {
			throw new BadRequestException((err as Error).message);
		}
	}

	/**
	 * Supprime l'échéancier si aucun encaissement ni échéance payée.
	 *
	 * @param invoiceId - ID facture
	 * @param organizationId - Organisation
	 */
	async clearSchedule(invoiceId: string, organizationId?: number): Promise<void> {
		const invoice = await this.assertInvoiceAccess(invoiceId, organizationId, {
			includePayments: true,
			includeInstallments: true,
		});
		if ((invoice.payments?.length ?? 0) > 0) {
			throw new BadRequestException('Échéancier verrouillé après encaissement');
		}
		const paidCount = (invoice.installments ?? []).filter((i) => i.status === 'PAID').length;
		if (paidCount > 0) {
			throw new BadRequestException('Des échéances sont déjà réglées');
		}
		await this.prisma.invoiceInstallment.deleteMany({ where: { invoiceId } });
	}

	/**
	 * Retourne la prochaine échéance en attente.
	 *
	 * @param invoiceId - ID facture
	 */
	async findNextPending(invoiceId: string) {
		return this.prisma.invoiceInstallment.findFirst({
			where: { invoiceId, status: 'PENDING' },
			orderBy: { sequence: 'asc' },
		});
	}

	/**
	 * Montant à prélever en ligne (Stripe) : prochaine échéance ou solde total.
	 *
	 * @param invoiceId - ID facture
	 * @param invoiceBalance - Solde restant calculé
	 */
	async resolveOnlinePaymentAmount(
		invoiceId: string,
		invoiceBalance: number,
	): Promise<{ amount: number; installmentId: number | null }> {
		const next = await this.findNextPending(invoiceId);
		if (!next) {
			return { amount: Math.max(0, invoiceBalance), installmentId: null };
		}
		return {
			amount: resolveOnlineInstallmentAmount(invoiceBalance, Number(next.amount)),
			installmentId: next.id,
		};
	}

	/**
	 * Affecte un encaissement aux échéances en attente (FIFO).
	 *
	 * @param invoiceId - ID facture
	 * @param paymentId - Paiement créé
	 * @param paymentAmount - Montant encaissé
	 */
	async allocatePayment(invoiceId: string, paymentId: number, paymentAmount: number): Promise<void> {
		const pending = await this.prisma.invoiceInstallment.findMany({
			where: { invoiceId, status: 'PENDING' },
			orderBy: { sequence: 'asc' },
		});
		if (pending.length === 0) return;

		const coveredIds = resolveInstallmentsCoveredByPayment(
			pending.map((p) => ({ id: p.id, amount: Number(p.amount) })),
			paymentAmount,
		);
		if (coveredIds.length === 0) return;

		const paidAt = new Date();
		await this.prisma.invoiceInstallment.updateMany({
			where: { id: { in: coveredIds } },
			data: { status: 'PAID', paymentId, paidAt },
		});
	}

	/**
	 * Annule les échéances restantes quand la facture est annulée.
	 *
	 * @param invoiceId - ID facture
	 */
	async cancelPendingInstallments(invoiceId: string): Promise<void> {
		await this.prisma.invoiceInstallment.updateMany({
			where: { invoiceId, status: 'PENDING' },
			data: { status: 'CANCELLED' },
		});
	}

	/**
	 * Résumés échéancier pour plusieurs factures (listes).
	 *
	 * @param invoiceIds - Identifiants factures de la page courante
	 */
	async summarizeForInvoiceIds(
		invoiceIds: string[],
	): Promise<Map<string, InvoiceInstallmentSummary>> {
		const map = new Map<string, InvoiceInstallmentSummary>();
		if (!invoiceIds.length) return map;

		const rows = await this.prisma.invoiceInstallment.findMany({
			where: { invoiceId: { in: invoiceIds } },
			orderBy: [{ invoiceId: 'asc' }, { sequence: 'asc' }],
		});

		const byInvoice = new Map<string, typeof rows>();
		for (const row of rows) {
			const list = byInvoice.get(row.invoiceId) ?? [];
			list.push(row);
			byInvoice.set(row.invoiceId, list);
		}

		for (const [invoiceId, list] of byInvoice) {
			const summary = buildInvoiceInstallmentSummary(list);
			if (summary) map.set(invoiceId, summary);
		}
		return map;
	}

	private toDto(row: {
		id: number;
		sequence: number;
		amount: unknown;
		dueDate: Date;
		status: string;
		paymentId: number | null;
		paidAt: Date | null;
	}): InvoiceInstallmentDto {
		return {
			id: row.id,
			sequence: row.sequence,
			amount: Number(row.amount),
			dueDate: row.dueDate.toISOString(),
			status: row.status as InvoiceInstallmentDto['status'],
			paymentId: row.paymentId,
			paidAt: row.paidAt?.toISOString() ?? null,
			overdue: isInstallmentOverdue(row.dueDate, row.status),
		};
	}

	private async assertInvoiceAccess(
		invoiceId: string,
		organizationId?: number,
		options?: { includePayments?: boolean; includeInstallments?: boolean },
	) {
		const invoice = await this.prisma.invoice.findFirst({
			where: {
				id: invoiceId,
				...(organizationId != null ? { organizationId } : {}),
			},
			include: {
				payments: options?.includePayments ?? false,
				installments: options?.includeInstallments ?? false,
			},
		});
		if (!invoice) throw new NotFoundException('Facture non trouvée');
		return invoice;
	}
}
