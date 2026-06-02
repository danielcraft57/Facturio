import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { AccountingService } from '../accounting/accounting.service';
import { ConfigService } from '../config/config.service';
import { BillingService } from '../billing/billing.service';
import { assertValidPublicToken } from './public-token.util';
import { buildPublicInvoiceUrl } from '../common/public-app-url';
import { attachListEmailEngagementFlags, getInvoiceEmailEngagement } from '../common/email-engagement.util';
import { InvoicePaymentNotificationService } from './invoice-payment-notification.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { groupByYearAndMonth } from '../common/archive-group.util';
import {
	buildDocumentFolderWhere,
	documentFolderOrderBy,
	parseTagsJson,
	serializeTagsJson,
} from '../common/document-folder.util';
import type { InvoiceListQueryDto } from './dto/invoice-document-folder.dto';
import type { UpdateInvoiceDocumentFlagsDto } from './dto/invoice-document-folder.dto';
import { generateEntityId } from '../common/entity-id';
import {
	parseQuoteIdFromSplitTags,
	resolveInvoiceDocumentPresentation,
	type EngagementBreakdown,
} from './invoice-deposit.util';
import { resolveEngagementBreakdownForInvoice } from './invoice-engagement-breakdown.util';
import { canAccessInvoiceByPublicToken } from './invoice-public-access.util';
import { AvoirsService } from '../avoirs/avoirs.service';

export type InvoiceNumberKind = 'standard' | 'deposit' | 'remainder';

/**
 * Ligne de facture
 */
export interface InvoiceLineInput {
	/** Référence produit (optionnel, ex. facture issue d'un devis) */
	productId?: number | null;
	/** Description de la ligne */
	description: string;
	/** Quantité */
	quantity: number;
	/** Prix unitaire (HT) */
	unitPrice: number;
	/** Taux de TVA (ex: 0.2 pour 20%). Si non fourni, utilise le taux par défaut */
	taxRate?: number;
}

/**
 * Données de création de facture
 */
export interface CreateInvoiceInput {
	/** Numéro de facture (auto-généré si non fourni) */
	number?: string;
	/** ID du client (ou clientEmail pour création automatique) */
	clientId?: string;
	/** Date d'échéance */
	dueDate?: string | Date | null;
	/** Catégorie d'opération réforme (GOODS, SERVICE, MIXED) */
	operationCategory?: 'GOODS' | 'SERVICE' | 'MIXED';
	/** Option TVA sur les débits */
	vatOnDebits?: boolean;
	/** Adresse de livraison si différente */
	deliveryAddress?: string | null;
	/** Statut de la facture */
	status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
	/** Lignes de facture */
	lines?: InvoiceLineInput[];
	/** Devise (défaut: EUR) */
	currency?: string;
	/** Devis d’origine (conversion devis → facture) */
	sourceQuoteId?: string;
	/** Mention légale affichée (acompte, TVA, etc.) — remplace la mention TVA auto si fournie */
	legalMention?: string | null;
	/** Déjà réglée hors Facturio (autre site, virement, etc.) */
	paidExternally?: boolean;
	externalPaymentDate?: string | Date;
	externalPaymentMethod?: string;
	/** Met à jour l’email du client à la création */
	clientEmail?: string;
	clientName?: string;
	applyClientCredits?: boolean;
}

/**
 * Données de mise à jour de facture
 */
export interface UpdateInvoiceInput {
	/** Numéro de facture */
	number?: string;
	/** ID du client */
	clientId?: string;
	/** Date d'échéance */
	dueDate?: string | Date | null;
	/** Catégorie d'opération réforme (GOODS, SERVICE, MIXED) */
	operationCategory?: 'GOODS' | 'SERVICE' | 'MIXED';
	/** Option TVA sur les débits */
	vatOnDebits?: boolean;
	/** Adresse de livraison si différente */
	deliveryAddress?: string | null;
	/** Statut de la facture */
	status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
	/** Lignes de facture */
	lines?: InvoiceLineInput[];
	/** Devise */
	currency?: string;
}

/**
 * Service de gestion des factures
 * 
 * Gère :
 * - La création de factures avec numérotation automatique
 * - Le calcul automatique des totaux (HT, TVA, TTC)
 * - La politique TVA selon le client (FR, UE, international, exonéré)
 * - La comptabilisation à l'émission (vente VE) et au paiement (encaissement BQ)
 * - La gestion des paiements et du solde
 * - Le filtrage multi-tenant par organizationId
 * 
 * @see InvoicesController pour les endpoints API
 */
/** Mapping des champs de tri API → champs Prisma Invoice (ex. issueDate → date) */
const SORT_FIELD_MAP: Record<string, string> = {
	issueDate: 'date',
	date: 'date',
	dueDate: 'dueDate',
	createdAt: 'createdAt',
	updatedAt: 'updatedAt',
	number: 'number',
	status: 'status',
	total: 'total',
	balance: 'balance',
};

@Injectable()
export class InvoicesService {
	private readonly logger = new Logger(InvoicesService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly accounting: AccountingService,
		private readonly config: ConfigService,
		private readonly billing: BillingService,
		private readonly paidNotifications: InvoicePaymentNotificationService,
		private readonly realtime: RealtimeEventsService,
		private readonly avoirs: AvoirsService,
	) {}

	private async applyAvailableClientCredits(
		invoiceId: string,
		clientId: string,
		organizationId: number,
	): Promise<number> {
		const invoice = await this.prisma.invoice.findUnique({
			where: { id: invoiceId },
			select: { balance: true, status: true },
		});
		if (!invoice) return 0;
		let remaining = Number(invoice.balance ?? 0);
		if (remaining <= 0.01 || invoice.status === 'CANCELLED') return 0;

		const credits = await this.prisma.avoir.findMany({
			where: {
				clientId,
				organizationId,
				invoiceId: null,
				status: { in: ['SENT', 'APPLIED'] },
			},
			orderBy: { date: 'asc' },
		});

		let appliedTotal = 0;
		for (const credit of credits) {
			if (remaining <= 0.01) break;
			const available = Number(credit.total) - Number(credit.appliedAmount ?? 0);
			if (available <= 0.01) continue;
			const amountToApply = Math.min(available, remaining);
			if (amountToApply <= 0.01) continue;
			await this.avoirs.apply(
				credit.id,
				{ invoiceId, amount: Number(amountToApply.toFixed(2)) },
				organizationId,
			);
			appliedTotal += amountToApply;
			remaining = Number((remaining - amountToApply).toFixed(2));
		}

		await this.syncInvoiceFinancials(invoiceId, { organizationId });
		return Number(appliedTotal.toFixed(2));
	}

	private notifyInvoice(
		organizationId: number | undefined,
		action: 'created' | 'updated' | 'deleted' | 'sent' | 'paid',
		id: string,
		meta?: { number?: string; status?: string },
	): void {
		if (organizationId) this.realtime.emit(organizationId, 'invoices', action, id, meta);
	}

	/** Somme des avoirs déjà imputés sur la facture (AvoirApplication). */
	async getAppliedCreditTotal(invoiceId: string): Promise<number> {
		const agg = await this.prisma.avoirApplication.aggregate({
			where: { invoiceId },
			_sum: { amount: true },
		});
		return Number(agg._sum.amount ?? 0);
	}

	/**
	 * Recalcule balance + statut à partir du TTC, encaissements et avoirs imputés.
	 */
	async syncInvoiceFinancials(
		invoiceId: string,
		options?: { organizationId?: number },
	): Promise<{
		grossTotal: number;
		cashPaid: number;
		refunded: number;
		netPaid: number;
		appliedCreditTotal: number;
		balance: number;
		settlementLabel: 'A_PAYER' | 'SOLDEE_CB' | 'SOLDEE_AVOIR' | 'SOLDEE_MIXTE' | 'ANNULEE';
	}> {
		const where: { id: string; organizationId?: number } = { id: invoiceId };
		if (options?.organizationId != null) where.organizationId = options.organizationId;

		const invoice = await this.prisma.invoice.findFirst({
			where,
			include: {
				payments: true,
				refunds: { where: { status: 'COMPLETED' } },
			},
		});
		if (!invoice) throw new NotFoundException('Facture non trouvée');

		const grossTotal = Number(invoice.total);
		const cashPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
		const refunded = invoice.refunds.reduce((s, r) => s + Number(r.amount), 0);
		const netPaid = Number((cashPaid - refunded).toFixed(2));
		const appliedCreditTotal = await this.getAppliedCreditTotal(invoiceId);
		const balance = Math.max(0, Number((grossTotal - netPaid - appliedCreditTotal).toFixed(2)));

		let status = invoice.status;
		if (invoice.status !== 'CANCELLED') {
			if (balance <= 0.01) {
				status = 'PAID';
			} else if (status === 'PAID' && balance > 0.01) {
				status = 'SENT';
			}
		}

		let settlementLabel: 'A_PAYER' | 'SOLDEE_CB' | 'SOLDEE_AVOIR' | 'SOLDEE_MIXTE' | 'ANNULEE' =
			'A_PAYER';
		if (invoice.status === 'CANCELLED') {
			settlementLabel = 'ANNULEE';
		} else if (balance <= 0.01) {
			if (netPaid >= grossTotal - 0.01) {
				settlementLabel = 'SOLDEE_CB';
			} else if (appliedCreditTotal >= grossTotal - 0.01 && netPaid < 0.01) {
				settlementLabel = 'SOLDEE_AVOIR';
			} else if (appliedCreditTotal > 0.01) {
				settlementLabel = 'SOLDEE_MIXTE';
			}
		}

		const storedBalance = Number(invoice.balance ?? 0);
		if (
			Math.abs(storedBalance - balance) > 0.01 ||
			(status !== invoice.status && invoice.status !== 'CANCELLED')
		) {
			await this.prisma.invoice.update({
				where: { id: invoiceId },
				data: { balance, status },
			});
		}

		return {
			grossTotal,
			cashPaid,
			refunded,
			netPaid,
			appliedCreditTotal,
			balance,
			settlementLabel,
		};
	}

	private async enrichInvoiceWithSettlement(invoice: any, organizationId?: number) {
		const settlement = await this.syncInvoiceFinancials(invoice.id, { organizationId });
		return {
			...invoice,
			appliedCreditTotal: settlement.appliedCreditTotal,
			balance: settlement.balance,
			settlement: settlement.settlementLabel,
			settlementDetails: settlement,
		};
	}

	/** Statuts pour lesquels la vente doit être comptabilisée (émise, pas brouillon). */
	private isEmittedInvoiceStatus(status: string): boolean {
		return status === 'SENT' || status === 'PAID' || status === 'OVERDUE';
	}

	/** Écriture VE 411/706/44571 — à l'émission, pas en brouillon (idempotent). */
	private async postSaleOnEmission(invoiceId: string): Promise<void> {
		try {
			await this.accounting.postInvoiceSale({ invoiceId });
		} catch (err) {
			this.logger.warn(`Compta vente facture ${invoiceId}: ${(err as Error).message}`);
		}
	}

	/**
	 * Récupère le taux de TVA par défaut
	 * 
	 * @returns Taux de TVA par défaut (0.2 = 20% si aucun taux défini)
	 * @private
	 */
  private async getDefaultTaxRate(): Promise<number> {
    const def = await this.prisma.taxRate.findFirst({ where: { isDefault: true } });
    if (!def) {
      return this.config.defaultVatRate;
    }
    const value = (def.rate as any)?.toNumber?.() ?? Number(def.rate);
    return value || this.config.defaultVatRate;
  }

	/**
	 * Calcule les totaux d'une facture (HT, TVA, TTC)
	 * 
	 * @param lines - Lignes de facture
	 * @returns Totaux calculés
	 * @private
	 */
	private async computeTotals(lines: InvoiceLineInput[] = []) {
		let subtotal = 0;
		let tax = 0;
		for (const l of lines) {
			const lineBase = l.quantity * l.unitPrice;
			const rate = l.taxRate ?? 0;
			const lineTax = lineBase * rate;
			subtotal += lineBase;
			tax += lineTax;
		}
		const total = subtotal + tax;
		return { subtotal, tax, total };
	}

	/**
	 * Détermine la politique TVA selon le client
	 * 
	 * Règles :
	 * - France : TVA standard (taux par défaut)
	 * - UE avec numéro TVA : Autoliquidation (0%)
	 * - Hors UE : Export (0%)
	 * - Exonéré : 0%
	 * 
	 * @param params - Informations client
	 * @returns Politique TVA (rate: -1 = utiliser taux par défaut, mention légale)
	 * @private
	 */
  private computeVatPolicy(params: { countryCode?: string | null; isCompany?: boolean; vatNumber?: string | null; isVatExempt?: boolean; }): { rate: number; mention?: string } {
    if (params.isVatExempt) return { rate: 0, mention: 'Operation exoneree de TVA' };
    const cc = (params.countryCode || 'FR').toUpperCase();
    const isFR = cc === 'FR';
    if (isFR) return { rate: -1 }; // -1 signifie utiliser le taux par defaut
    // UE hors France
    const eu = ['AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'];
    const inEU = eu.includes(cc);
    if (inEU && params.isCompany && params.vatNumber) {
      return { rate: 0, mention: 'Autoliquidation de la TVA - article 283-2 du CGI' };
    }
    // par défaut pour international hors UE -> 0, sinon on pourrait gérer TVA locale via OSS/B2C plus tard
    if (!inEU) return { rate: 0, mention: 'Hors champ TVA (export)' };
    return { rate: -1 };
  }

	/**
	 * Génère le prochain numéro de facture
	 * 
	 * Format : {PREFIX}-YYYY-NNNN (FAC, ACO acompte, SOL solde).
	 * Compteur distinct par préfixe et par année.
	 */
  private async nextInvoiceNumber(prefix = 'FAC'): Promise<string> {
    const year = new Date().getFullYear();
    const scope = `invoice-${prefix}-${year}`;
    for (let attempt = 0; attempt < 100; attempt++) {
      const counter = await this.prisma.counter.upsert({
        where: { scope },
        create: { scope, current: 1 },
        update: { current: { increment: 1 } },
      });
      const padded = String(counter.current).padStart(4, '0');
      const number = `${prefix}-${year}-${padded}`;
      const taken = await this.prisma.invoice.findUnique({
        where: { number },
        select: { id: true },
      });
      if (!taken) return number;
    }
    throw new BadRequestException('Impossible de générer un numéro de facture unique');
  }

	/** Numéro réservé pour une nouvelle facture (standard, acompte ou solde). */
	async allocateInvoiceNumber(kind: InvoiceNumberKind = 'standard'): Promise<string> {
		const prefix = kind === 'deposit' ? 'ACO' : kind === 'remainder' ? 'SOL' : 'FAC';
		return this.nextInvoiceNumber(prefix);
	}

	/**
	 * Crée une nouvelle facture
	 * 
	 * Processus :
	 * 1. Validation des données (client, lignes)
	 * 2. Calcul de la politique TVA selon le client
	 * 3. Calcul des totaux (HT, TVA, TTC)
	 * 4. Génération du numéro de facture
	 * 5. Création en base avec lignes
	 * 6. Comptabilisation automatique (écriture 411/706/44571)
	 * 
	 * @param data - Données de la facture
	 * @param organizationId - ID de l'organisation (multi-tenant)
	 * @returns Facture créée avec lignes, client et paiements
	 * @throws {BadRequestException} Si validation échoue
	 * 
	 * @example
	 * ```typescript
	 * const invoice = await invoicesService.create({
	 *   clientId: 1,
	 *   lines: [
	 *     { description: 'Service', quantity: 1, unitPrice: 1000, taxRate: 0.2 }
	 *   ]
	 * }, 1);
	 * ```
	 */
	private deriveClientNameFromEmail(email: string): string {
		const local = email.split('@')[0]?.replace(/[._+-]+/g, ' ').trim();
		return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Client';
	}

	/** Résout clientId : fiche existante, création si email inconnu, ou erreur. */
	private async resolveClientIdForInvoice(
		data: CreateInvoiceInput,
		organizationId: number,
	): Promise<string> {
		if (data.clientId) {
			const existing = await this.prisma.client.findFirst({
				where: { id: data.clientId, organizationId },
			});
			if (!existing) {
				throw new NotFoundException(`Client avec l'ID ${data.clientId} introuvable`);
			}
			if (data.clientEmail?.trim()) {
				await this.prisma.client.update({
					where: { id: data.clientId },
					data: { email: data.clientEmail.trim() },
				});
			}
			return data.clientId;
		}

		const email = data.clientEmail?.trim();
		if (!email) {
			throw new BadRequestException(
				'Indiquez un client existant (clientId) ou un email pour créer une fiche client.',
			);
		}

		const found = await this.prisma.client.findUnique({ where: { email } });
		if (found) {
			if (found.organizationId != null && found.organizationId !== organizationId) {
				throw new BadRequestException(
					'Cet email est déjà utilisé par un client d\'une autre organisation.',
				);
			}
			if (found.organizationId == null) {
				await this.prisma.client.update({
					where: { id: found.id },
					data: { organizationId },
				});
			}
			return found.id;
		}

		const name = data.clientName?.trim() || this.deriveClientNameFromEmail(email);
		const created = await this.prisma.client.create({
			data: {
				id: generateEntityId(),
				name,
				email,
				organizationId,
				isCompany: false,
			},
		});
		return created.id;
	}

	async create(data: CreateInvoiceInput, organizationId?: number) {
		const lines = data.lines ?? [];
		if (lines.length === 0) {
			throw new BadRequestException('Au moins une ligne est requise');
		}
		for (const l of lines) {
			if (l.quantity <= 0) throw new BadRequestException('Quantite invalide');
			if (l.unitPrice < 0) throw new BadRequestException('Prix unitaire invalide');
		}

		if (!organizationId) {
			throw new BadRequestException('OrganizationId requis pour créer une facture.');
		}

		const organization = await this.prisma.organization.findUnique({
			where: { id: organizationId },
		});
		if (!organization) {
			throw new NotFoundException(`Organisation avec l'ID ${organizationId} introuvable`);
		}

		const clientId = await this.resolveClientIdForInvoice(data, organizationId);
		const client = await this.prisma.client.findUnique({ where: { id: clientId } });
		if (!client) {
			throw new NotFoundException(`Client avec l'ID ${clientId} introuvable`);
		}

		const orgId = organizationId;

		// Politique TVA par client
		const policy = this.computeVatPolicy({
			countryCode: client.countryCode,
			isCompany: client.isCompany,
			vatNumber: client.vatNumber,
			isVatExempt: client.isVatExempt
		});
		const defaultRate = await this.getDefaultTaxRate();
		const effectiveRate = policy.rate === -1 ? (client.taxRateOverrideId ? (await this.prisma.taxRate.findUnique({ where: { id: client.taxRateOverrideId } }))?.rate as any ?? defaultRate : defaultRate) : policy.rate;
		const linesWithTax = lines.map(l => ({ ...l, taxRate: l.taxRate ?? effectiveRate }));
		const totals = await this.computeTotals(linesWithTax);

		await this.billing.assertCanCreateInvoice(orgId);

		const markPaid = data.paidExternally === true || data.status === 'PAID';
		const invoiceStatus = markPaid ? 'PAID' : (data.status ?? 'DRAFT');
		const balance = markPaid ? 0 : totals.total;

		const numberKind: InvoiceNumberKind = !data.number
			? 'standard'
			: data.number.startsWith('ACO-')
				? 'deposit'
				: data.number.startsWith('SOL-')
					? 'remainder'
					: 'standard';

		let reservedNumber = data.number;
		let created: Awaited<ReturnType<typeof this.prisma.invoice.create>> | null = null;
		for (let attempt = 0; attempt < 8; attempt++) {
			const number = reservedNumber ?? (await this.allocateInvoiceNumber(numberKind));
			try {
				created = await this.prisma.invoice.create({
					data: {
						id: generateEntityId(),
						number,
						clientId,
						organizationId: orgId,
						dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
						operationCategory: data.operationCategory,
						vatOnDebits: data.vatOnDebits,
						deliveryAddress:
							data.deliveryAddress === undefined || data.deliveryAddress === null
								? undefined
								: data.deliveryAddress.trim() || null,
						status: invoiceStatus,
						currency: data.currency ?? 'EUR',
						subtotal: totals.subtotal,
						tax: totals.tax,
						total: totals.total,
						balance,
						legalMention: data.legalMention ?? policy.mention,
						sourceQuoteId: data.sourceQuoteId ?? undefined,
						lines: {
							create: linesWithTax.map((l) => ({
								productId: (l as { productId?: number }).productId ?? undefined,
								description: l.description,
								quantity: l.quantity,
								unitPrice: l.unitPrice,
								taxRate: l.taxRate,
								taxAmount: l.quantity * l.unitPrice * l.taxRate,
								total: l.quantity * l.unitPrice * (1 + l.taxRate),
							})),
						},
					},
					include: { lines: true, client: true, payments: true, appliedAvoirs: true },
				});
				break;
			} catch (err: unknown) {
				const code = (err as { code?: string })?.code;
				if (code === 'P2002' && !data.number && attempt < 7) {
					reservedNumber = undefined;
					continue;
				}
				throw err;
			}
		}
		if (!created) {
			throw new BadRequestException('Impossible de créer la facture (numéro en conflit)');
		}

		if (!markPaid && data.applyClientCredits !== false) {
			await this.applyAvailableClientCredits(created.id, clientId, orgId);
		}

		if (this.isEmittedInvoiceStatus(invoiceStatus)) {
			await this.postSaleOnEmission(created.id);
		}

		if (markPaid) {
			const payDate = data.externalPaymentDate ? new Date(data.externalPaymentDate) : new Date();
			const extPayment = await this.prisma.payment.create({
				data: {
					invoiceId: created.id,
					amount: totals.total,
					date: payDate,
					method: data.externalPaymentMethod?.trim() || 'Autre site',
					notes: 'Règlement enregistré à la création (paiement externe)',
				},
			});
			try {
				await this.accounting.postInvoicePayment({
					invoiceId: created.id,
					amount: totals.total,
					paymentId: extPayment.id,
					date: payDate
				});
			} catch (_) {}
			const full = await this.findOne(created.id, orgId);
			this.notifyInvoice(orgId, 'paid', created.id, {
				number: created.number,
				status: 'PAID',
			});
			return full;
		}

		const settled = await this.syncInvoiceFinancials(created.id, { organizationId: orgId });
		const full = await this.findOne(created.id, orgId);
		this.notifyInvoice(
			orgId,
			settled.balance <= 0.01 ? 'paid' : 'created',
			created.id,
			{ number: full.number, status: full.status },
		);
		return full;
	}

	/**
	 * Liste les factures avec pagination, recherche et tri
	 * 
	 * @param query - Paramètres de pagination/recherche/tri
	 * @param organizationId - ID de l'organisation (filtre multi-tenant)
	 * @returns Liste paginée de factures avec lignes, client et paiements
	 */
	async findAll(query: InvoiceListQueryDto | ListQueryDto, organizationId?: number) {
		const q = query as InvoiceListQueryDto;
		const page = query.page ?? 1;
		const pageSize = query.pageSize ?? query.limit ?? 20;
		const skip = (page - 1) * pageSize;
		const useFolderSort = !!q.folder;
		const sortBy = useFolderSort
			? 'createdAt'
			: query.sortBy
				? (SORT_FIELD_MAP[query.sortBy] ?? query.sortBy)
				: 'createdAt';
		const order = (query.order ?? query.sortOrder ?? 'desc') as 'asc' | 'desc';

		this.logger.log(
			`findAll pagination=${page}/${pageSize} folder=${q.folder ?? 'inbox'} orgId=${organizationId ?? 'any'}`
		);

		const where: any = {};
		if (query.search) {
			where.OR = [
				{ number: { contains: query.search } },
				{ client: { name: { contains: query.search } } as any },
			];
		}
		if (organizationId) {
			where.organizationId = organizationId;
		}
		where.archivedAt = null;
		const folderFilter = buildDocumentFolderWhere(q.folder, new Date(), 'invoice');
		Object.assign(where, folderFilter);
		if (q.tag?.trim()) {
			where.tags = { contains: `"${q.tag.trim()}"` };
		}
		if (q.clientId?.trim()) {
			where.clientId = q.clientId.trim();
		}

		try {
			const [items, total] = await this.prisma.$transaction([
				this.prisma.invoice.findMany({
					skip,
					take: pageSize,
					where,
					orderBy: useFolderSort
						? documentFolderOrderBy('invoice')
						: { [sortBy]: order },
					include: { lines: true, client: true, payments: true, appliedAvoirs: true }
				}),
				this.prisma.invoice.count({ where })
			]);
			const folderCounts =
				q.includeFolderCounts && page === 1
					? await this.loadFolderCounts(organizationId)
					: undefined;
			this.logger.log(`findAll returned ${items.length} items, total=${total}`);
			const reconciled = await Promise.all(
				items.map((inv) => this.reconcileRemainderAwaitingSend(inv)),
			);
			const withEmailFlags = await attachListEmailEngagementFlags(this.prisma, reconciled, 'invoice');
			const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
			return {
				invoices: withEmailFlags,
				total,
				page,
				limit: pageSize,
				totalPages,
				...(folderCounts ? { folderCounts } : {}),
			};
		} catch (err) {
			this.logger.error(`findAll failed: ${err instanceof Error ? err.message : String(err)}`, err instanceof Error ? err.stack : undefined);
			throw err;
		}
	}

	/**
	 * Récupère une facture par ID
	 * 
	 * @param id - ID de la facture
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Facture avec lignes, client et paiements
	 * @throws {NotFoundException} Si facture non trouvée
	 */
	async findOne(id: string, organizationId?: number) {
		const where: { id: string; organizationId?: number } = { id };
		if (organizationId != null) where.organizationId = organizationId;
		let invoice = await this.prisma.invoice.findFirst({
			where,
			include: { lines: true, client: true, payments: true, appliedAvoirs: true }
		});
		if (!invoice) throw new NotFoundException('Facture non trouvee');
		invoice = await this.reconcileRemainderAwaitingSend(invoice);
		const enriched = await this.enrichInvoiceWithSettlement(invoice, organizationId);
		const emailEngagement = await getInvoiceEmailEngagement(this.prisma, enriched.id);
		return { ...enriched, emailEngagement };
	}

	/**
	 * Factures de solde : restent en brouillon jusqu’à un envoi email explicite.
	 * Corrige les anciennes factures SOL marquées « envoyées » par erreur à l’acceptation du devis.
	 */
	private async reconcileRemainderAwaitingSend<
		T extends {
			id: string;
			status: string;
			sentAt: Date | null;
			balance: unknown;
			tags: string | null;
			payments?: { amount: unknown }[];
		},
	>(invoice: T): Promise<T> {
		const tags = parseTagsJson(invoice.tags);
		if (!tags.includes('SOLDE_APRES_ACOMPTE')) return invoice;

		const totalPaid = (invoice.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
		const balance = Number(invoice.balance ?? 0);
		const isPaid = balance <= 0 || totalPaid > 0;
		if (isPaid) return invoice;

		const sentByEmail = await this.prisma.emailEvent.count({
			where: { invoiceId: invoice.id, type: 'sent' },
		});
		if (sentByEmail > 0) {
			return invoice;
		}

		if (tags.includes('PENDING_EMIT')) {
			if (invoice.status === 'SENT' || invoice.sentAt) {
				await this.prisma.invoice.update({
					where: { id: invoice.id },
					data: { status: 'DRAFT', sentAt: null },
				});
				return { ...invoice, status: 'DRAFT', sentAt: null };
			}
			return invoice;
		}

		if (invoice.status !== 'SENT' && !invoice.sentAt) {
			const withTag = serializeTagsJson([...tags, 'PENDING_EMIT']);
			await this.prisma.invoice.update({
				where: { id: invoice.id },
				data: { tags: withTag },
			});
			return { ...invoice, tags: withTag };
		}

		const nextTags = serializeTagsJson([...tags, 'PENDING_EMIT']);
		await this.prisma.invoice.update({
			where: { id: invoice.id },
			data: { status: 'DRAFT', sentAt: null, tags: nextTags },
		});
		return { ...invoice, status: 'DRAFT', sentAt: null, tags: nextTags };
	}

	/**
	 * Met à jour une facture
	 * 
	 * Recalcule automatiquement les totaux et le solde en tenant compte des paiements.
	 * 
	 * @param id - ID de la facture
	 * @param data - Données de mise à jour
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Facture mise à jour
	 * @throws {NotFoundException} Si facture non trouvée
	 */
	async update(id: string, data: UpdateInvoiceInput, organizationId?: number) {
		await this.findOne(id, organizationId);

		const lines = data.lines ?? [];
		const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: { client: true } });
		const client = invoice?.client;
		const policy = this.computeVatPolicy({
			countryCode: client?.countryCode,
			isCompany: client?.isCompany,
			vatNumber: client?.vatNumber,
			isVatExempt: client?.isVatExempt
		});
		const defaultRate = await this.getDefaultTaxRate();
		const effectiveRate = policy.rate === -1 ? (client?.taxRateOverrideId ? (await this.prisma.taxRate.findUnique({ where: { id: client!.taxRateOverrideId! } }))?.rate as any ?? defaultRate : defaultRate) : policy.rate;
		const linesWithTax = lines.map(l => ({ ...l, taxRate: l.taxRate ?? effectiveRate }));
		const totals = await this.computeTotals(linesWithTax);

		// recalculer le solde en tenant compte des paiements existants
		const agg = await this.prisma.payment.aggregate({ where: { invoiceId: id }, _sum: { amount: true } });
		const paid = agg?._sum?.amount ? (agg._sum.amount as any).toNumber?.() ?? Number(agg._sum.amount) : 0;
		const newBalance = totals.total - paid;

		const previousStatus = invoice?.status ?? 'DRAFT';
		const updated = await this.prisma.invoice.update({
			where: { id },
			data: {
				number: data.number,
				clientId: data.clientId,
				dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
				operationCategory: data.operationCategory,
				vatOnDebits: data.vatOnDebits,
				deliveryAddress:
					data.deliveryAddress === undefined || data.deliveryAddress === null
						? undefined
						: data.deliveryAddress.trim() || null,
				status: data.status,
				currency: data.currency,
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				balance: newBalance,
				lines: {
					deleteMany: {},
					create: linesWithTax.map(l => ({
						productId: (l as any).productId ?? undefined,
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate,
						taxAmount: l.quantity * l.unitPrice * l.taxRate,
						total: l.quantity * l.unitPrice * (1 + l.taxRate)
					}))
				}
			},
			include: { lines: true, client: true, payments: true }
		});
		if (
			this.isEmittedInvoiceStatus(updated.status) &&
			!this.isEmittedInvoiceStatus(previousStatus)
		) {
			await this.postSaleOnEmission(id);
		}
		this.notifyInvoice(organizationId, 'updated', id, {
			number: updated.number,
			status: updated.status,
		});
		return updated;
	}

	/**
	 * Supprime une facture
	 * 
	 * @param id - ID de la facture
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Confirmation de suppression
	 * @throws {NotFoundException} Si facture non trouvée
	 */
	/** Archive une facture (aucune suppression en base). */
	async archive(id: string, organizationId?: number) {
		const invoice = await this.findOne(id, organizationId);
		if (invoice.archivedAt) {
			return { success: true, alreadyArchived: true };
		}
		const updated = await this.prisma.invoice.update({
			where: { id },
			data: { archivedAt: new Date() },
			include: { client: true },
		});
		this.notifyInvoice(organizationId, 'updated', id, {
			number: updated.number,
			status: updated.status,
		});
		return { success: true, archivedAt: updated.archivedAt };
	}

	/** Restaure une facture archivée dans la liste active. */
	async restore(id: string, organizationId?: number) {
		const invoice = await this.findOne(id, organizationId);
		if (!invoice.archivedAt) {
			return { success: true, alreadyActive: true };
		}
		const updated = await this.prisma.invoice.update({
			where: { id },
			data: { archivedAt: null },
			include: { client: true },
		});
		this.notifyInvoice(organizationId, 'updated', id, {
			number: updated.number,
			status: updated.status,
		});
		return { success: true };
	}

	/** Factures archivées groupées par année et mois (date de facture). */
	async findArchivedGrouped(organizationId?: number) {
		const where: { archivedAt: { not: null }; organizationId?: number } = {
			archivedAt: { not: null },
		};
		if (organizationId) where.organizationId = organizationId;
		const items = await this.prisma.invoice.findMany({
			where,
			orderBy: { date: 'desc' },
			include: { client: true },
		});
		return {
			groups: groupByYearAndMonth(items, (i) => i.date),
			total: items.length,
		};
	}

	/** @deprecated Utiliser archive — conserve DELETE pour compatibilité. */
	async remove(id: string, organizationId?: number) {
		return this.archive(id, organizationId);
	}

	private async loadFolderCounts(organizationId?: number) {
		const base: { organizationId?: number; archivedAt: null } = { archivedAt: null };
		if (organizationId) base.organizationId = organizationId;
		const now = new Date();
		const count = (extra: Record<string, unknown>) =>
			this.prisma.invoice.count({ where: { ...base, ...extra } });

		const [inbox, nouveau, suivi, attente, important, envoyes, brouillons, archives] =
			await Promise.all([
				count(buildDocumentFolderWhere('inbox', now, 'invoice')),
				count(buildDocumentFolderWhere('nouveau', now, 'invoice')),
				count(buildDocumentFolderWhere('suivi', now, 'invoice')),
				count(buildDocumentFolderWhere('attente', now, 'invoice')),
				count(buildDocumentFolderWhere('important', now, 'invoice')),
				count(buildDocumentFolderWhere('envoyes', now, 'invoice')),
				count(buildDocumentFolderWhere('brouillons', now, 'invoice')),
				this.prisma.invoice.count({
					where: {
						archivedAt: { not: null },
						...(organizationId ? { organizationId } : {}),
					},
				}),
			]);

		return { inbox, nouveau, suivi, attente, important, envoyes, brouillons, archives };
	}

	async getFolderCounts(organizationId?: number) {
		return this.loadFolderCounts(organizationId);
	}

	async updateDocumentFlags(
		id: string,
		dto: UpdateInvoiceDocumentFlagsDto,
		organizationId?: number,
	) {
		await this.findOne(id, organizationId);
		const data: Record<string, unknown> = {};
		if (dto.starred !== undefined) data.starred = dto.starred;
		if (dto.important !== undefined) data.important = dto.important;
		if (dto.snoozedUntil !== undefined) {
			data.snoozedUntil = dto.snoozedUntil ? new Date(dto.snoozedUntil) : null;
		}
		if (dto.tags !== undefined) data.tags = serializeTagsJson(dto.tags);
		if (dto.markSeen) data.seenAt = new Date();
		const updated = await this.prisma.invoice.update({
			where: { id },
			data,
			include: { client: true },
		});
		this.notifyInvoice(organizationId, 'updated', id, {
			number: updated.number,
			status: updated.status,
		});
		return {
			...updated,
			tags: parseTagsJson(updated.tags),
		};
	}

	/**
	 * Liste les paiements d'une facture
	 * 
	 * @param id - ID de la facture
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Liste des paiements triés par date décroissante
	 */
	async listPayments(id: string, organizationId?: number) {
		await this.findOne(id, organizationId);
		const payments = await this.prisma.payment.findMany({
			where: { invoiceId: id },
			orderBy: { date: 'desc' },
			include: { refunds: { where: { status: 'COMPLETED' } } },
		});
		return payments.map((p) => {
			const refunded = p.refunds.reduce((s, r) => s + Number(r.amount), 0);
			const amount = Number(p.amount);
			return {
				...p,
				amount,
				refundedAmount: refunded,
				refundableAmount: Math.max(0, amount - refunded),
			};
		});
	}

	/**
	 * Ajoute un paiement à une facture
	 * 
	 * Met à jour automatiquement :
	 * - Le solde de la facture
	 * - Le statut (PAID si solde <= 0)
	 * - Crée l'écriture comptable (512/411)
	 * 
	 * @param id - ID de la facture
	 * @param amount - Montant du paiement
	 * @param date - Date du paiement (optionnel, défaut: maintenant)
	 * @param method - Méthode de paiement (optionnel)
	 * @param notes - Notes (optionnel)
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Paiement créé
	 * @throws {NotFoundException} Si facture non trouvée
	 */
	async addPayment(id: string, amount: number, date?: string | Date, method?: string, notes?: string, organizationId?: number) {
		const invoice = await this.findOne(id, organizationId);
		const before = await this.syncInvoiceFinancials(id, { organizationId });
		const wasFullyPaid = before.balance <= 0.01;

		if (amount > before.balance + 0.01) {
			throw new BadRequestException(
				`Le montant du paiement (${amount}) dépasse le solde restant (${before.balance})`,
			);
		}

		const payment = await this.prisma.payment.create({
			data: { invoiceId: id, amount, date: date ? new Date(date) : undefined, method, notes }
		});
		const after = await this.syncInvoiceFinancials(id, { organizationId });
		const newStatus = after.balance <= 0.01 ? 'PAID' : invoice.status;
		// Comptabilisation de l'encaissement (512/411)
		try {
			await this.accounting.postInvoicePayment({
				invoiceId: id,
				amount,
				paymentId: payment.id,
				date: payment.date
			});
		} catch (_) {}

		if (after.balance <= 0.01 && !wasFullyPaid) {
			void this.paidNotifications.notifyInvoiceFullyPaid(id, {
				lastPaymentAmount: amount,
				paymentMethod: method,
			});
		}

		this.notifyInvoice(
			organizationId,
			after.balance <= 0.01 && !wasFullyPaid ? 'paid' : 'updated',
			id,
			{ number: invoice.number, status: after.balance <= 0.01 ? 'PAID' : invoice.status },
		);

		// Retourner le paiement en nombre pour .toBe(250)
		return { ...payment, amount: (payment.amount as any)?.toNumber?.() ?? Number(payment.amount) } as any;
	}

	/**
	 * Visualise une facture via token public (enregistre un événement "opened" si tracking).
	 *
	 * @param token - Token public de la facture
	 * @returns Données facture pour affichage public
	 * @throws {NotFoundException} Si facture non trouvée
	 */
	/**
	 * Réponse publique minimale (aucune donnée interne sensible).
	 */
	private async buildEngagementBreakdown(invoice: {
		id: string;
		sourceQuoteId: string | null;
		total: unknown;
		tags: string | null;
		organizationId: number | null;
	}): Promise<EngagementBreakdown | null> {
		return resolveEngagementBreakdownForInvoice(this.prisma, invoice);
	}

	private async toPublicInvoiceDto(
		invoice: {
			id: string;
			sourceQuoteId: string | null;
			organizationId: number | null;
			number: string;
			date: Date;
			dueDate: Date | null;
			status: string;
			currency: string;
			subtotal: unknown;
			tax: unknown;
			total: unknown;
			legalMention: string | null;
			tags: string | null;
			sentAt: Date | null;
			lines: { description: string; quantity: unknown; unitPrice: unknown; total: unknown }[];
			client: { name: string | null; companyName: string | null } | null;
			organization: {
				name: string | null;
				legalName: string | null;
				privacyPolicyUrl?: string | null;
				dataControllerEmail?: string | null;
				invoiceStripeSecretKey?: string | null;
				invoiceStripePublishableKey?: string | null;
			} | null;
			payments: { amount: unknown }[];
			appliedAvoirs?: { amount: unknown; avoirId: number }[];
		},
		balance: number,
		totalPaid: number,
		appliedCreditOverride?: number,
	) {
		const org = invoice.organization;
		const stripeEnabled = !!(
			org?.invoiceStripeSecretKey?.trim() && org?.invoiceStripePublishableKey?.trim()
		);
		const canPayOnline = balance > 0 && stripeEnabled && invoice.status !== 'CANCELLED';
		const tags = parseTagsJson(invoice.tags);
		const presentation = resolveInvoiceDocumentPresentation(tags, invoice.legalMention, invoice.dueDate);
		const engagementBreakdown = await this.buildEngagementBreakdown(invoice);
		const appliedCreditTotal =
			appliedCreditOverride ??
			(invoice.appliedAvoirs ?? []).reduce(
				(sum: number, a: { amount: unknown }) => sum + Number(a.amount ?? 0),
				0,
			);
		return {
			number: invoice.number,
			documentKind: presentation.kind,
			titleLabel: presentation.titleLabel,
			commitmentParagraph: presentation.commitmentParagraph,
			engagementBreakdown,
			tags,
			date: invoice.date,
			dueDate: invoice.dueDate,
			status: invoice.status,
			currency: invoice.currency || 'EUR',
			subtotal: Number(invoice.subtotal),
			tax: Number(invoice.tax),
			total: Number(invoice.total),
			balance,
			totalPaid,
			appliedCreditTotal: Number(appliedCreditTotal.toFixed(2)),
			legalMention: invoice.legalMention,
			stripeEnabled,
			stripePublishableKey: org?.invoiceStripePublishableKey?.trim() || null,
			canPayOnline,
			issuerName:
				invoice.organization?.legalName ||
				invoice.organization?.name ||
				process.env.COMPANY_NAME ||
				'',
			privacyPolicyUrl: org?.privacyPolicyUrl?.trim() || null,
			dataControllerEmail: org?.dataControllerEmail?.trim() || null,
			client: {
				name: invoice.client?.name || invoice.client?.companyName || ''
			},
			lines: invoice.lines.map((line) => ({
				description: line.description,
				quantity: Number(line.quantity),
				unitPrice: Number(line.unitPrice),
				total: Number(line.total)
			}))
		};
	}

	/** Charge la facture complète pour génération PDF (accès token + envoyée). */
	async findByPublicTokenForPdf(token: string) {
		const safeToken = assertValidPublicToken(token);
		const invoice = await this.prisma.invoice.findUnique({
			where: { publicToken: safeToken },
			include: {
				lines: true,
				client: true,
				payments: true,
				appliedAvoirs: {
					include: { avoir: { select: { number: true } } },
				},
				organization: {
					select: {
						name: true,
						legalName: true,
						privacyPolicyUrl: true,
						dataControllerEmail: true,
						invoiceStripeSecretKey: true,
						invoiceStripePublishableKey: true,
					},
				},
			},
		});
		if (!invoice?.publicToken || !canAccessInvoiceByPublicToken(invoice)) {
			throw new NotFoundException('Facture introuvable');
		}
		await this.syncInvoiceFinancials(invoice.id);
		const refreshed = await this.prisma.invoice.findUnique({
			where: { id: invoice.id },
			include: {
				lines: true,
				client: true,
				payments: true,
				appliedAvoirs: {
					include: { avoir: { select: { number: true } } },
				},
				organization: {
					select: {
						name: true,
						legalName: true,
						privacyPolicyUrl: true,
						dataControllerEmail: true,
						invoiceStripeSecretKey: true,
						invoiceStripePublishableKey: true,
					},
				},
			},
		});
		return refreshed ?? invoice;
	}

	async publicView(token: string) {
		const safeToken = assertValidPublicToken(token);
		const invoice = await this.prisma.invoice.findUnique({
			where: { publicToken: safeToken },
			include: {
				lines: true,
				client: true,
				payments: true,
				appliedAvoirs: true,
				organization: {
					select: {
						name: true,
						legalName: true,
						privacyPolicyUrl: true,
						dataControllerEmail: true,
						invoiceStripeSecretKey: true,
						invoiceStripePublishableKey: true,
					},
				},
			}
		});
		if (!invoice?.publicToken || !canAccessInvoiceByPublicToken(invoice)) {
			throw new NotFoundException('Facture introuvable');
		}
		const settlement = await this.syncInvoiceFinancials(invoice.id);
		const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
		return this.toPublicInvoiceDto(
			invoice,
			settlement.balance,
			totalPaid,
			settlement.appliedCreditTotal,
		);
	}

	static buildPublicPaymentUrl(token: string): string {
		return buildPublicInvoiceUrl(token);
	}

	/**
	 * Lien de paiement public sans marquer la facture comme « envoyée » (facture de solde en brouillon).
	 */
	async ensurePublicPaymentLink(id: string, organizationId?: number) {
		const invoice = await this.findOne(id, organizationId);
		const tags = parseTagsJson(invoice.tags);
		const isRemainderDraft =
			tags.includes('SOLDE_APRES_ACOMPTE') &&
			invoice.status !== 'PAID' &&
			Number(invoice.balance) > 0;

		if (!isRemainderDraft) {
			return this.sendInvoice(id, organizationId);
		}

		const orgId = invoice.organizationId ?? organizationId;
		if (!orgId) {
			throw new BadRequestException('Organisation introuvable pour cette facture');
		}
		const org = await this.prisma.organization.findUnique({
			where: { id: orgId },
			select: { invoiceStripeSecretKey: true, invoiceStripePublishableKey: true },
		});
		const stripeOk = Boolean(
			org?.invoiceStripeSecretKey?.trim() && org?.invoiceStripePublishableKey?.trim(),
		);
		if (!stripeOk) {
			throw new BadRequestException(
				"Paiement en ligne Stripe non configuré. Allez dans Paramètres → Paiements : /parametres/paiements",
			);
		}

		const token = invoice.publicToken ?? randomBytes(32).toString('hex');
		const nextTags = tags.includes('PENDING_EMIT')
			? invoice.tags
			: serializeTagsJson([...tags, 'PENDING_EMIT']);
		const updated = await this.prisma.invoice.update({
			where: { id },
			data: {
				publicToken: token,
				status: 'DRAFT',
				sentAt: null,
				tags: nextTags,
			},
			include: { lines: true, client: true },
		});
		const publicUrl = InvoicesService.buildPublicPaymentUrl(token);
		return { ...updated, publicUrl };
	}

	/**
	 * Envoie une facture par email : génère un token public, met à jour sentAt, enregistre l'événement "sent".
	 *
	 * @param id - ID de la facture
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Facture mise à jour avec publicToken et publicUrl
	 * @throws {NotFoundException} Si facture non trouvée
	 */
	async sendInvoice(id: string, organizationId?: number) {
		const invoice = await this.findOne(id, organizationId);

		const token = invoice.publicToken ?? randomBytes(32).toString('hex');
		const keepPaid =
			invoice.status === 'PAID' || Number(invoice.balance) <= 0;
		const nextStatus = keepPaid ? 'PAID' : 'SENT';
		const tags = parseTagsJson(invoice.tags);
		const tagsWithoutPending = serializeTagsJson(
			tags.filter((t) => t !== 'PENDING_EMIT'),
		);
		const updated = await this.prisma.invoice.update({
			where: { id },
			data: {
				publicToken: token,
				sentAt: new Date(),
				status: nextStatus,
				tags: tagsWithoutPending,
			},
			include: { lines: true, client: true }
		});
		if (this.isEmittedInvoiceStatus(nextStatus)) {
			await this.postSaleOnEmission(id);
		}
		const publicUrl = InvoicesService.buildPublicPaymentUrl(token);
		this.notifyInvoice(organizationId, 'sent', id, {
			number: updated.number,
			status: nextStatus,
		});
		return { ...updated, publicUrl };
	}

	/**
	 * Prépare une relance : vérifie que la facture a été envoyée et n'est pas soldée.
	 */
	async prepareReminder(id: string, organizationId?: number) {
		const invoice = await this.findOne(id, organizationId);
		if (!invoice.sentAt) {
			throw new BadRequestException('Envoyez la facture au client avant d\'envoyer une relance');
		}
		if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
			throw new BadRequestException('Impossible de relancer une facture payée ou annulée');
		}
		const email = (invoice.client as { email?: string | null })?.email;
		if (!email) {
			throw new BadRequestException('Le client n\'a pas d\'adresse email');
		}
		const token = invoice.publicToken;
		if (!token) {
			throw new BadRequestException('Lien public de la facture indisponible');
		}
		let daysOverdue: number | undefined;
		if (invoice.dueDate) {
			const due = new Date(invoice.dueDate);
			const diff = Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24));
			if (diff > 0) daysOverdue = diff;
		}
		await this.prisma.emailEvent.create({
			data: { invoiceId: id, type: 'reminder' }
		});
		return {
			invoice,
			daysOverdue,
			publicUrl: InvoicesService.buildPublicPaymentUrl(token)
		};
	}
}


