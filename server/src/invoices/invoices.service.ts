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
	/** Statut de la facture */
	status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
	/** Lignes de facture */
	lines?: InvoiceLineInput[];
	/** Devise (défaut: EUR) */
	currency?: string;
	/** Devis d’origine (conversion devis → facture) */
	sourceQuoteId?: string;
	/** Déjà réglée hors Facturio (autre site, virement, etc.) */
	paidExternally?: boolean;
	externalPaymentDate?: string | Date;
	externalPaymentMethod?: string;
	/** Met à jour l’email du client à la création */
	clientEmail?: string;
	clientName?: string;
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
 * - La comptabilisation automatique (écritures comptables)
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
	) {}

	private notifyInvoice(
		organizationId: number | undefined,
		action: 'created' | 'updated' | 'deleted' | 'sent' | 'paid',
		id: string,
		meta?: { number?: string; status?: string },
	): void {
		if (organizationId) this.realtime.emit(organizationId, 'invoices', action, id, meta);
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
	 * Format : FAC-YYYY-NNNN (ex: FAC-2024-0001)
	 * Utilise un compteur par année.
	 * 
	 * @returns Numéro de facture unique
	 * @private
	 */
  private async nextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const scope = `invoice-${year}`;
    const counter = await this.prisma.counter.upsert({
      where: { scope },
      create: { scope, current: 1 },
      update: { current: { increment: 1 } }
    });
    const padded = String(counter.current).padStart(4, '0');
    return `FAC-${year}-${padded}`;
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
		const number = data.number ?? (await this.nextInvoiceNumber());

		await this.billing.assertCanCreateInvoice(orgId);

		const markPaid = data.paidExternally === true || data.status === 'PAID';
		const invoiceStatus = markPaid ? 'PAID' : (data.status ?? 'DRAFT');
		const balance = markPaid ? 0 : totals.total;
		
		const created = await this.prisma.invoice.create({
			data: {
				number,
				clientId,
				organizationId: orgId,
				dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
				status: invoiceStatus,
				currency: data.currency ?? 'EUR',
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				balance,
				legalMention: policy.mention,
				sourceQuoteId: data.sourceQuoteId ?? undefined,
				lines: {
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

		// Comptabilisation automatique de la vente (411/706/44571)
		try {
			await this.accounting.postInvoiceSale({ invoiceId: created.id });
		} catch (_) {}

		if (markPaid) {
			const payDate = data.externalPaymentDate ? new Date(data.externalPaymentDate) : new Date();
			await this.prisma.payment.create({
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
				});
			} catch (_) {}
			const full = await this.findOne(created.id, orgId);
			this.notifyInvoice(orgId, 'paid', created.id, {
				number: created.number,
				status: 'PAID',
			});
			return full;
		}

		this.notifyInvoice(orgId, 'created', created.id, {
			number: created.number,
			status: created.status,
		});
		return created;
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

		try {
			const [items, total] = await this.prisma.$transaction([
				this.prisma.invoice.findMany({
					skip,
					take: pageSize,
					where,
					orderBy: useFolderSort
						? documentFolderOrderBy('invoice')
						: { [sortBy]: order },
					include: { lines: true, client: true, payments: true }
				}),
				this.prisma.invoice.count({ where })
			]);
			const folderCounts =
				q.includeFolderCounts && page === 1
					? await this.loadFolderCounts(organizationId)
					: undefined;
			this.logger.log(`findAll returned ${items.length} items, total=${total}`);
			const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
			return {
				invoices: items,
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
		const invoice = await this.prisma.invoice.findFirst({
			where,
			include: { lines: true, client: true, payments: true }
		});
		if (!invoice) throw new NotFoundException('Facture non trouvee');
		return invoice;
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

		const updated = await this.prisma.invoice.update({
			where: { id },
			data: {
				number: data.number,
				clientId: data.clientId,
				dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
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

		const [inbox, nouveau, suivi, attente, important, envoyes, brouillons] =
			await Promise.all([
				count(buildDocumentFolderWhere('inbox', now, 'invoice')),
				count(buildDocumentFolderWhere('nouveau', now, 'invoice')),
				count(buildDocumentFolderWhere('suivi', now, 'invoice')),
				count(buildDocumentFolderWhere('attente', now, 'invoice')),
				count(buildDocumentFolderWhere('important', now, 'invoice')),
				count(buildDocumentFolderWhere('envoyes', now, 'invoice')),
				count(buildDocumentFolderWhere('brouillons', now, 'invoice')),
			]);

		return { inbox, nouveau, suivi, attente, important, envoyes, brouillons };
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
		return this.prisma.payment.findMany({ where: { invoiceId: id }, orderBy: { date: 'desc' } });
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
		const invoiceTotal = Number(invoice.total);
		const priorPaid = (invoice.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
		const remaining = invoiceTotal - priorPaid;
		const wasFullyPaid = invoice.status === 'PAID' || remaining <= 0;

		const payment = await this.prisma.payment.create({
			data: { invoiceId: id, amount, date: date ? new Date(date) : undefined, method, notes }
		});
		const agg = await this.prisma.payment.aggregate({ where: { invoiceId: id }, _sum: { amount: true } });
		const paid = agg?._sum?.amount ? (agg._sum.amount as any).toNumber?.() ?? Number(agg._sum.amount) : 0;
		const newBalance = invoiceTotal - paid;
		const newStatus = newBalance <= 0 ? 'PAID' : (invoice.status as any);
		await this.prisma.invoice.update({
			where: { id },
			data: { balance: newBalance, status: newStatus },
			include: { lines: true, client: true, payments: true }
		});
		// Comptabilisation de l'encaissement (512/411)
		try {
			await this.accounting.postInvoicePayment({ invoiceId: id, amount });
		} catch (_) {}

		if (newStatus === 'PAID' && !wasFullyPaid) {
			void this.paidNotifications.notifyInvoiceFullyPaid(id, {
				lastPaymentAmount: amount,
				paymentMethod: method,
			});
		}

		this.notifyInvoice(
			organizationId,
			newStatus === 'PAID' && !wasFullyPaid ? 'paid' : 'updated',
			id,
			{ number: invoice.number, status: newStatus },
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
	private toPublicInvoiceDto(
		invoice: {
			number: string;
			date: Date;
			dueDate: Date | null;
			status: string;
			currency: string;
			subtotal: unknown;
			tax: unknown;
			total: unknown;
			legalMention: string | null;
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
		},
		balance: number,
		totalPaid: number
	) {
		const org = invoice.organization;
		const stripeEnabled = !!(
			org?.invoiceStripeSecretKey?.trim() && org?.invoiceStripePublishableKey?.trim()
		);
		const canPayOnline = balance > 0 && stripeEnabled && invoice.status !== 'CANCELLED';
		return {
			number: invoice.number,
			date: invoice.date,
			dueDate: invoice.dueDate,
			status: invoice.status,
			currency: invoice.currency || 'EUR',
			subtotal: Number(invoice.subtotal),
			tax: Number(invoice.tax),
			total: Number(invoice.total),
			balance,
			totalPaid,
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
			include: { lines: true, client: true }
		});
		if (!invoice || !invoice.sentAt) {
			throw new NotFoundException('Facture introuvable');
		}
		return invoice;
	}

	async publicView(token: string) {
		const safeToken = assertValidPublicToken(token);
		const invoice = await this.prisma.invoice.findUnique({
			where: { publicToken: safeToken },
			include: {
				lines: true,
				client: true,
				payments: true,
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
		if (!invoice || !invoice.sentAt) {
			throw new NotFoundException('Facture introuvable');
		}
		const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
		const total = Number(invoice.total);
		const balance = Math.round((total - totalPaid) * 100) / 100;
		return this.toPublicInvoiceDto(invoice, balance, totalPaid);
	}

	static buildPublicPaymentUrl(token: string): string {
		return buildPublicInvoiceUrl(token);
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
		const updated = await this.prisma.invoice.update({
			where: { id },
			data: { publicToken: token, sentAt: new Date(), status: nextStatus },
			include: { lines: true, client: true }
		});
		await this.prisma.emailEvent.create({
			data: { invoiceId: id, type: 'sent' }
		});
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


