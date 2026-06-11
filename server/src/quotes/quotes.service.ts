import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as crypto from 'crypto';
import { AccountingService } from '../accounting/accounting.service';
import { buildPublicQuoteUrl } from '../common/public-app-url';
import { attachListEmailEngagementFlags, getQuoteEmailEngagement } from '../common/email-engagement.util';
import { InvoicesService } from '../invoices/invoices.service';
import { ProductsService } from '../products/products.service';
import {
	buildProductQuoteLineDescription,
	productHasEnrichableContent,
} from '../products/product-quote-description.util';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { groupByYearAndMonth } from '../common/archive-group.util';
import {
	buildDocumentFolderWhere,
	computeDocumentFolderCounts,
	documentFolderOrderBy,
	parseTagsJson,
	serializeTagsJson,
} from '../common/document-folder.util';
import type { QuoteListQueryDto } from './dto/quote-document-folder.dto';
import type { UpdateQuoteDocumentFlagsDto } from './dto/quote-document-folder.dto';
import { generateEntityId } from '../common/entity-id';
import {
	buildDepositCommitmentParagraph,
	buildRemainderCommitmentParagraph,
} from '../invoices/invoice-deposit.util';
import {
	computeInvoiceDueDate,
	DEFAULT_DEPOSIT_DUE_POLICY,
	DEFAULT_REMAINDER_DUE_POLICY,
	DEFAULT_STANDARD_DUE_POLICY,
} from '../invoices/invoice-due-date.util';

type ResolvedQuoteLine = {
	productId?: number;
	description: string;
	quantity: number;
	unitPrice: number;
	taxRate?: number;
};

/**
 * Ligne de devis
 */
export interface QuoteLineDto {
	/** Référence produit (optionnel, pour devis par sélection de produits) */
	productId?: number | null;
	/**
	 * SKU catalogue : réutilise le produit de l’organisation ou le crée si absent.
	 * Nécessite description (ou productName) + unitPrice lors de la création.
	 */
	productSku?: string | null;
	/** Nom du produit à créer si productSku inconnu (sinon description ou SKU) */
	productName?: string | null;
	/** Description de la ligne (déduite du produit si productId / productSku fourni) */
	description?: string;
	/** Quantité */
	quantity: number;
	/** Prix unitaire HT (déduit du produit si productId fourni) */
	unitPrice?: number;
	/** Taux de TVA (ex: 0.2 pour 20%) */
	taxRate?: number;
}

/**
 * Données de création de devis
 */
export interface CreateQuoteDto {
	/** Numéro de devis (auto-généré si non fourni) */
	number?: string;
	/** ID du client */
	clientId: string;
	/** Date d'expiration */
	expiryDate?: string | Date | null;
	/** Statut du devis */
	status?: QuoteStatus;
	/** Lignes de devis */
	lines?: QuoteLineDto[];
}

/**
 * Données de mise à jour de devis
 */
export interface UpdateQuoteDto {
	/** Numéro de devis */
	number?: string;
	/** ID du client */
	clientId?: string;
	/** Date d'expiration */
	expiryDate?: string | Date | null;
	/** Statut du devis */
	status?: QuoteStatus;
	/** Lignes de devis */
	lines?: QuoteLineDto[];
}

/**
 * Paiement d'un devis (acompte ou 100%).
 *
 * Le paiement :
 * - valide la commande en acceptant le devis
 * - convertit le devis en facture (si nécessaire)
 * - ajoute un paiement sur la facture (qui réduit la balance)
 */
export interface PayQuoteDto {
	/** 100% ou acompte */
	mode: 'FULL' | 'DEPOSIT';
	/** Taux d'acompte (ex: 0.1 pour 10%). Défault: 0.1 */
	depositRate?: number;
	/** Date du paiement (optionnel). Default: maintenant */
	date?: string | Date;
	/** Méthode paiement (optionnel) */
	method?: string;
	/** Notes (optionnel) */
	notes?: string;
}

/**
 * Acceptation publique d'un devis avec création et envoi de factures
 * (100% ou acompte).
 *
 * Objectif : générer des factures publiques prêtes à être payées en ligne via Stripe.
 */
export interface PublicAcceptDepositDto {
	mode: 'FULL' | 'DEPOSIT';
	/** Par défaut : 0.1 => 10% */
	depositRate?: number;
}

/**
 * Service de gestion des devis
 * 
 * Gère :
 * - La création de devis avec numérotation automatique
 * - Le calcul automatique des totaux (HT, TVA, TTC)
 * - L'envoi de devis avec token public
 * - La visualisation publique (tracking des vues)
 * - L'acceptation/rejet publique
 * - La comptabilisation hors-bilan (écritures DRAFT)
 * - La contre-passation en cas de rejet/expiration
 * 
 * @see QuotesController pour les endpoints API
 */
@Injectable()
export class QuotesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly accounting: AccountingService,
		private readonly invoices: InvoicesService,
		private readonly products: ProductsService,
		private readonly realtime: RealtimeEventsService,
	) {}

	private async isInvoiceStripeConfigured(organizationId: number): Promise<boolean> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: { invoiceStripeSecretKey: true, invoiceStripePublishableKey: true },
		});
		return Boolean(
			org?.invoiceStripeSecretKey?.trim() && org?.invoiceStripePublishableKey?.trim(),
		);
	}

	private async assertInvoiceStripeConfigured(organizationId: number) {
		if (await this.isInvoiceStripeConfigured(organizationId)) return;
		throw new BadRequestException(
			'Paiement en ligne non configuré : ce devis ne pourra pas être facturé ni réglé en ligne par le client. Paramètres → Paiements : /parametres/paiements',
		);
	}

	private notifyQuote(
		organizationId: number | undefined,
		action: 'created' | 'updated' | 'deleted' | 'sent' | 'paid',
		id: string,
		meta?: { number?: string; status?: string },
	): void {
		if (organizationId) this.realtime.emit(organizationId, 'quotes', action, id, meta);
	}

	/**
	 * Trouve la facture "acompte 10%" associée à un devis.
	 * On la détecte via le tag enregistré pendant le split.
	 */
	async findDepositInvoiceForQuote(quoteId: string, organizationId: number) {
		const depositTag = this.quoteDepositTag(quoteId);
		return this.prisma.invoice.findFirst({
			where: {
				organizationId,
				tags: { contains: `"${depositTag}"` },
			},
			include: { client: true },
		});
	}

	/** Contexte acompte / solde pour l’UI back-office (fiche devis). */
	async getDepositContextForQuote(quoteId: string, organizationId: number) {
		await this.findOne(quoteId, organizationId);
		const depositTag = this.quoteDepositTag(quoteId);
		const remainderTag = this.quoteRemainderTag(quoteId);

		const [deposit, remainder] = await Promise.all([
			this.prisma.invoice.findFirst({
				where: { organizationId, tags: { contains: `"${depositTag}"` } },
				include: { payments: true, refunds: { where: { status: 'COMPLETED' } } },
			}),
			this.prisma.invoice.findFirst({
				where: { organizationId, tags: { contains: `"${remainderTag}"` } },
				select: { id: true, number: true, status: true, total: true, balance: true, tags: true },
			}),
		]);

		const mapInvoice = (inv: typeof deposit) => {
			if (!inv) return null;
			const tags = parseTagsJson(inv.tags);
			const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
			const refunded = (inv.refunds ?? []).reduce((s, r) => s + Number(r.amount), 0);
			const total = Number(inv.total);
			const balance = Number((inv.balance as any)?.toNumber?.() ?? inv.balance ?? 0);
			return {
				id: inv.id,
				number: inv.number,
				status: inv.status,
				total,
				balance,
				netPaid: paid - refunded,
				depositRefunded: tags.includes('ACOMPTE_REFUNDED'),
				engagementCancelled: tags.includes('ENGAGEMENT_CANCELLED'),
			};
		};

		return {
			hasSplit: Boolean(deposit && remainder),
			deposit: mapInvoice(deposit),
			remainder: remainder
				? {
						id: remainder.id,
						number: remainder.number,
						status: remainder.status,
						total: Number(remainder.total),
						balance: Number((remainder.balance as any)?.toNumber?.() ?? remainder.balance ?? 0),
					}
				: null,
		};
	}

	private quoteDepositTag(quoteId: string): string {
		return `ACOMPTE_10_OF:${quoteId}`;
	}

	private quoteRemainderTag(quoteId: string): string {
		return `SOLDE_APRES_ACOMPTE_OF:${quoteId}`;
	}

	private isQuoteDepositInvoice(invoice: { tags: string | null }, quoteId: string): boolean {
		const tags = parseTagsJson(invoice.tags);
		return tags.includes('ACOMPTE_10') || tags.includes(this.quoteDepositTag(quoteId));
	}

	private resolveInvoiceOrgId(invoice: { organizationId: number | null }, fallbackOrgId: number): number {
		return invoice.organizationId ?? fallbackOrgId;
	}

	private async sendInvoiceForPublicPayment(
		invoiceId: string,
		invoice: { organizationId: number | null },
		fallbackOrgId: number,
	) {
		return this.invoices.sendInvoice(invoiceId, this.resolveInvoiceOrgId(invoice, fallbackOrgId));
	}

	private async ensureRemainderPublicPaymentLink(
		invoiceId: string,
		invoice: { organizationId: number | null },
		fallbackOrgId: number,
	) {
		return this.invoices.ensurePublicPaymentLink(
			invoiceId,
			this.resolveInvoiceOrgId(invoice, fallbackOrgId),
		);
	}

	/**
	 * Retrouve une facture déjà créée pour ce devis (sourceQuoteId, tags acompte, ou FAC orpheline même client/montant).
	 */
	private async resolveInvoiceLinkedToQuote(
		quote: { id: string; clientId: string; total: unknown },
		orgId: number,
	) {
		const bySource = await this.prisma.invoice.findUnique({
			where: { sourceQuoteId: quote.id },
		});
		if (bySource) return bySource;

		const depositTag = this.quoteDepositTag(quote.id);
		const byDepositTag = await this.prisma.invoice.findFirst({
			where: {
				organizationId: orgId,
				tags: { contains: `"${depositTag}"` },
			},
		});
		if (byDepositTag) {
			if (!byDepositTag.sourceQuoteId) {
				try {
					return await this.prisma.invoice.update({
						where: { id: byDepositTag.id },
						data: { sourceQuoteId: quote.id },
					});
				} catch {
					return byDepositTag;
				}
			}
			return byDepositTag;
		}

		const quoteTotal = Number(quote.total ?? 0);
		const candidates = await this.prisma.invoice.findMany({
			where: {
				organizationId: orgId,
				clientId: quote.clientId,
				sourceQuoteId: null,
				archivedAt: null,
			},
			orderBy: { createdAt: 'desc' },
			take: 15,
		});
		const fullOrphans = candidates.filter((inv) => {
			const tags = parseTagsJson(inv.tags);
			if (tags.includes('ACOMPTE_10') || tags.includes('SOLDE_APRES_ACOMPTE')) return false;
			if (Math.abs(Number(inv.total) - quoteTotal) > 0.02) return false;
			return true;
		});
		if (fullOrphans.length >= 1) {
			const pick = fullOrphans[0];
			try {
				return await this.prisma.invoice.update({
					where: { id: pick.id },
					data: { sourceQuoteId: quote.id },
				});
			} catch {
				return pick;
			}
		}

		return null;
	}

	/** Paiement 100 % : facture unique liée au devis (idempotent). */
	private async publicAcceptFullPayment(
		quote: {
			id: string;
			clientId: string;
			total: unknown;
			lines: { description: string; quantity: number; unitPrice: unknown; taxRate: unknown; productId?: number | null }[];
		},
		orgId: number,
	) {
		const remainderTag = this.quoteRemainderTag(quote.id);
		const linked = await this.resolveInvoiceLinkedToQuote(quote, orgId);

		if (linked) {
			if (this.isQuoteDepositInvoice(linked, quote.id)) {
				const remainder = await this.prisma.invoice.findFirst({
					where: { tags: { contains: `"${remainderTag}"` } },
				});
				const depositSent = await this.sendInvoiceForPublicPayment(linked.id, linked, orgId);
				return {
					status: 'accepted',
					depositInvoiceToken: depositSent.publicToken,
					depositInvoiceNumber: depositSent.number,
					...(remainder ? { remainderInvoiceNumber: remainder.number } : {}),
					message: remainder
						? 'Contrat d\'engagement déjà en cours : réglez l\'acompte 10 % ci-dessous. Le solde sera facturé séparément.'
						: 'Facture d\'acompte en cours — finalisez le contrat d\'engagement ou contactez votre prestataire.',
				};
			}
			const sent = await this.sendInvoiceForPublicPayment(linked.id, linked, orgId);
			return {
				status: 'accepted',
				invoiceToken: sent.publicToken,
				invoiceNumber: sent.number,
			};
		}

		if (!quote.lines?.length) {
			throw new BadRequestException(
				'Ce devis ne contient aucune ligne — impossible de générer la facture.',
			);
		}

		const invoice = await this.convertQuoteToInvoice(quote.id, orgId);
		const sent = await this.sendInvoiceForPublicPayment(invoice.id, invoice, orgId);
		return {
			status: 'accepted',
			invoiceToken: sent.publicToken,
			invoiceNumber: sent.number,
		};
	}

	/**
	 * Contre-passe l'écriture hors-bilan d'un devis
	 * 
	 * Utilisé quand un devis est rejeté ou expiré.
	 * 
	 * @param quoteNumber - Numéro du devis
	 * @private
	 */
	private async contraOffBalanceForQuote(quoteNumber: string): Promise<void> {
		const entry = await this.prisma.journalEntry.findFirst({
			where: { journal: { code: 'OD' }, reference: `DEV ${quoteNumber}` },
			include: { lines: { include: { account: true } }, journal: true },
			orderBy: { id: 'desc' }
		});
		if (!entry) return;
		const lines = entry.lines.map(l => ({
			accountCode: l.account.code,
			debit: (((l.credit as any)?.toNumber?.() ?? Number(l.credit)) || 0),
			credit: (((l.debit as any)?.toNumber?.() ?? Number(l.debit)) || 0),
			description: `Annulation ${l.description || ''}`.trim()
		}));
		await this.accounting.postEntry({
			journalCode: 'OD',
			reference: `ANNUL DEV ${quoteNumber}`,
			memo: 'Contre-passation devis (rejet/expiration)',
			lines
		});
	}

	/**
	 * Calcule les totaux d'un devis (HT, TVA, TTC)
	 * 
	 * @param lines - Lignes de devis
	 * @returns Totaux calculés
	 * @private
	 */
	private computeTotals(lines: QuoteLineDto[] = []) {
		let subtotal = 0;
		let tax = 0;
		for (const l of lines) {
			const unitPrice = l.unitPrice ?? 0;
			const base = l.quantity * unitPrice;
			const rate = l.taxRate ?? 0;
			subtotal += base;
			tax += base * rate;
		}
		return { subtotal, tax, total: subtotal + tax };
	}

	private async findProductForQuoteLine(productId: number, organizationId?: number) {
		if (organizationId != null) {
			const orgProduct = await this.prisma.product.findFirst({
				where: { id: productId, organizationId },
				include: { defaultTaxRate: true },
			});
			if (orgProduct) return orgProduct;

			const orgClone = await this.prisma.product.findFirst({
				where: { organizationId, templateProductId: productId },
				include: { defaultTaxRate: true },
			});
			if (orgClone) return orgClone;
		}

		return this.prisma.product.findFirst({
			where: { id: productId, organizationId: null },
			include: { defaultTaxRate: true },
		});
	}

	private async resolveQuoteLines(
		lines: QuoteLineDto[],
		organizationId?: number,
	): Promise<ResolvedQuoteLine[]> {
		const resolved: ResolvedQuoteLine[] = [];

		for (const line of lines) {
			if (line.quantity <= 0) {
				throw new BadRequestException('Quantite invalide');
			}

			let description = line.description?.trim() ?? '';
			let unitPrice = line.unitPrice;
			let taxRate = line.taxRate;
			let productId = line.productId ?? undefined;
			const productSku = line.productSku?.trim() ?? '';

			if (productId != null && productSku) {
				throw new BadRequestException('Utilisez productId ou productSku sur une ligne, pas les deux');
			}

			let linkedProduct: Awaited<ReturnType<typeof this.findProductForQuoteLine>> | null = null;

			if (productId != null) {
				const product = await this.findProductForQuoteLine(productId, organizationId);
				if (!product) {
					throw new BadRequestException(`Produit avec l'ID ${productId} introuvable`);
				}
				linkedProduct = product;
				productId = product.id;
				if (!description) description = product.name;
				if (unitPrice == null || Number.isNaN(Number(unitPrice))) {
					unitPrice = product.unitPrice != null ? Number(product.unitPrice) : 0;
				}
				if (taxRate == null && product.defaultTaxRate?.rate != null) {
					taxRate = Number(product.defaultTaxRate.rate);
				}
			} else if (productSku) {
				if (organizationId == null) {
					throw new BadRequestException('productSku requiert une organisation');
				}
				const existing = await this.products.findBySku(productSku, organizationId);
				if (!existing) {
					const createName =
						line.productName?.trim() || description || productSku;
					if (!createName) {
						throw new BadRequestException(
							'Description ou productName requis pour créer le produit (productSku inconnu)',
						);
					}
					if (unitPrice == null || Number.isNaN(Number(unitPrice))) {
						throw new BadRequestException(
							'unitPrice requis pour créer le produit (productSku inconnu)',
						);
					}
				}
				const product = await this.products.findOrCreateBySku(productSku, organizationId, {
					name: line.productName?.trim() || description || productSku,
					unitPrice: unitPrice != null ? Number(unitPrice) : undefined,
					description: description || undefined,
				});
				linkedProduct = product;
				productId = product.id;
				if (!description) description = product.name;
				if (unitPrice == null || Number.isNaN(Number(unitPrice))) {
					unitPrice = product.unitPrice != null ? Number(product.unitPrice) : 0;
				}
				if (taxRate == null && product.defaultTaxRate?.rate != null) {
					taxRate = Number(product.defaultTaxRate.rate);
				}
			}

			if (linkedProduct && productHasEnrichableContent(linkedProduct)) {
				const enriched = buildProductQuoteLineDescription(linkedProduct);
				const shortLabel = linkedProduct.name.trim();
				const userDesc = line.description?.trim() ?? '';
				if (!userDesc || userDesc === shortLabel || userDesc === (linkedProduct.description?.trim() ?? '')) {
					description = enriched;
				}
			}

			if (!description) {
				throw new BadRequestException('Description de ligne requise (ou productId valide)');
			}
			if (unitPrice == null || Number.isNaN(Number(unitPrice))) {
				throw new BadRequestException('Prix unitaire requis');
			}
			if (unitPrice < 0) {
				throw new BadRequestException('Prix unitaire invalide');
			}

			resolved.push({
				productId,
				description,
				quantity: line.quantity,
				unitPrice: Number(unitPrice),
				taxRate: taxRate ?? 0,
			});
		}

		return resolved;
	}

	/**
	 * Génère le prochain numéro de devis
	 * 
	 * Format : DEV-YYYY-NNNN (ex: DEV-2024-0001)
	 * Utilise un compteur par année.
	 * 
	 * @returns Numéro de devis unique
	 * @private
	 */
	private async nextQuoteNumber(): Promise<string> {
		const year = new Date().getFullYear();
		const scope = `quote-${year}`;
		for (let attempt = 0; attempt < 100; attempt++) {
			const counter = await this.prisma.counter.upsert({
				where: { scope },
				create: { scope, current: 1 },
				update: { current: { increment: 1 } },
			});
			const padded = String(counter.current).padStart(4, '0');
			const number = `DEV-${year}-${padded}`;
			const taken = await this.prisma.quote.findUnique({
				where: { number },
				select: { id: true },
			});
			if (!taken) return number;
		}
		throw new BadRequestException('Impossible de générer un numéro de devis unique');
	}

	/**
	 * Crée un nouveau devis
	 * 
	 * @param data - Données du devis
	 * @returns Devis créé avec lignes et client
	 * @throws {BadRequestException} Si validation échoue
	 */
	async create(data: CreateQuoteDto, organizationId?: number) {
		const clientId = String(data.clientId ?? '').trim();
		if (!clientId) {
			throw new BadRequestException('Client requis');
		}
		const rawLines = data.lines ?? [];
		if (rawLines.length === 0) {
			throw new BadRequestException('Au moins une ligne est requise');
		}

		const client = await this.prisma.client.findUnique({
			where: { id: clientId },
			select: { organizationId: true },
		});
		if (!client) {
			throw new NotFoundException(`Client avec l'ID ${clientId} introuvable`);
		}

		let orgId = organizationId;
		if (!orgId) {
			if (client.organizationId !== null) {
				orgId = client.organizationId;
			}
		}

		if (!orgId) {
			throw new BadRequestException('OrganizationId requis. Le client doit être associé à une organisation.');
		}

		if (
			client.organizationId != null &&
			client.organizationId !== orgId
		) {
			throw new BadRequestException('Ce client n\'appartient pas à votre organisation');
		}

		const organization = await this.prisma.organization.findUnique({
			where: { id: orgId },
		});
		if (!organization) {
			throw new NotFoundException(`Organisation avec l'ID ${orgId} introuvable`);
		}

		const lines = await this.resolveQuoteLines(rawLines, orgId);
		const totals = this.computeTotals(lines);
		const number = data.number ?? (await this.nextQuoteNumber());
		const created = await this.prisma.quote.create({
			data: {
				id: generateEntityId(),
				number,
				clientId,
				organizationId: orgId,
				expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
				status: data.status ?? QuoteStatus.DRAFT,
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				lines: {
					create: lines.map((l) => ({
						productId: l.productId ?? undefined,
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate ?? 0,
						taxAmount: l.quantity * l.unitPrice * (l.taxRate ?? 0),
						total: l.quantity * l.unitPrice * (1 + (l.taxRate ?? 0)),
					})),
				},
			},
			include: { lines: true, client: true },
		});
		this.notifyQuote(orgId, 'created', created.id, {
			number: created.number,
			status: created.status,
		});
		return created;
	}

	/**
	 * Liste les devis de l'organisation
	 *
	 * @param organizationId - ID de l'organisation (filtre multi-tenant)
	 * @returns Liste des devis avec lignes et client, triés par date décroissante
	 */
	async findAll(organizationId?: number, query?: QuoteListQueryDto) {
		const q = query ?? {};
		const page = q.page ?? 1;
		const pageSize = q.pageSize ?? q.limit ?? 20;
		const skip = (page - 1) * pageSize;
		const where: Record<string, unknown> = { archivedAt: null };
		if (organizationId != null) where.organizationId = organizationId;
		Object.assign(where, buildDocumentFolderWhere(q.folder, new Date(), 'quote'));
		if (q.tag?.trim()) {
			where.tags = { contains: `"${q.tag.trim()}"` };
		}
		if (q.search) {
			where.OR = [
				{ number: { contains: q.search } },
				{ client: { name: { contains: q.search } } },
			];
		}
		if (q.clientId?.trim()) {
			where.clientId = q.clientId.trim();
		}

		const [items, total] = await this.prisma.$transaction([
			this.prisma.quote.findMany({
				skip,
				take: pageSize,
				where: where as any,
				orderBy: q.folder
					? documentFolderOrderBy('quote')
					: { createdAt: 'desc' },
				include: { lines: true, client: true },
			}),
			this.prisma.quote.count({ where: where as any }),
		]);

		const folderCounts =
			q.includeFolderCounts && page === 1
				? await this.loadFolderCounts(organizationId)
				: undefined;

		const quotes = await attachListEmailEngagementFlags(this.prisma, items, 'quote');

		return {
			quotes,
			total,
			page,
			limit: pageSize,
			totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
			...(folderCounts ? { folderCounts } : {}),
		};
	}

	private async loadFolderCounts(organizationId?: number) {
		const base: { organizationId?: number; archivedAt: null } = { archivedAt: null };
		if (organizationId) base.organizationId = organizationId;
		const count = (extra: Record<string, unknown>) =>
			this.prisma.quote.count({ where: { ...base, ...extra } });

		return computeDocumentFolderCounts(count, 'quote', () =>
			this.prisma.quote.count({
				where: {
					archivedAt: { not: null },
					...(organizationId ? { organizationId } : {}),
				},
			}),
		);
	}

	async getFolderCounts(organizationId?: number) {
		return this.loadFolderCounts(organizationId);
	}

	async updateDocumentFlags(
		id: string,
		dto: UpdateQuoteDocumentFlagsDto,
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
		const updated = await this.prisma.quote.update({
			where: { id },
			data,
			include: { client: true },
		});
		this.notifyQuote(organizationId, 'updated', id, {
			number: updated.number,
			status: updated.status,
		});
		return { ...updated, tags: parseTagsJson(updated.tags) };
	}

	/**
	 * Récupère un devis par ID
	 *
	 * @param id - ID du devis
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Devis avec lignes et client
	 * @throws {NotFoundException} Si devis non trouvé
	 */
	async findOne(id: string, organizationId?: number) {
		const where: { id: string; organizationId?: number } = { id };
		if (organizationId != null) where.organizationId = organizationId;
		const quote = await this.prisma.quote.findFirst({
			where,
			include: {
				lines: true,
				client: true,
				convertedInvoice: { select: { id: true, number: true } },
			},
		});
		if (!quote) throw new NotFoundException('Devis non trouve');
		const emailEngagement = await getQuoteEmailEngagement(this.prisma, quote.id);
		return { ...quote, emailEngagement };
	}

	/**
	 * Met à jour un devis
	 *
	 * Si le statut passe à REJECTED ou EXPIRED, contre-passe l'écriture hors-bilan.
	 *
	 * @param id - ID du devis
	 * @param data - Données de mise à jour
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Devis mis à jour
	 * @throws {NotFoundException} Si devis non trouvé
	 */
	async update(id: string, data: UpdateQuoteDto, organizationId?: number) {
		const existing = await this.findOne(id, organizationId);
		const orgId = organizationId ?? existing.organizationId ?? undefined;
		const rawLines = data.lines ?? [];
		const lines =
			rawLines.length > 0 ? await this.resolveQuoteLines(rawLines, orgId) : [];
		const totals = this.computeTotals(lines);
		const updated = await this.prisma.quote.update({
			where: { id },
			data: {
				number: data.number,
				clientId: data.clientId,
				expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
				status: data.status,
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				lines: {
					deleteMany: {},
					create: lines.map((l) => ({
						productId: l.productId ?? undefined,
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate ?? 0,
						taxAmount: l.quantity * l.unitPrice * (l.taxRate ?? 0),
						total: l.quantity * l.unitPrice * (1 + (l.taxRate ?? 0)),
					})),
				},
			},
			include: { lines: true, client: true },
		});
		if (data.status === QuoteStatus.REJECTED || data.status === QuoteStatus.EXPIRED) {
			try { await this.contraOffBalanceForQuote(updated.number); } catch (_) {}
		}
		this.notifyQuote(organizationId ?? updated.organizationId ?? undefined, 'updated', id, {
			number: updated.number,
			status: updated.status,
		});
		return updated;
	}

	async archive(id: string, organizationId?: number) {
		const quote = await this.findOne(id, organizationId);
		if (quote.archivedAt) {
			return { success: true, alreadyArchived: true };
		}
		const updated = await this.prisma.quote.update({
			where: { id },
			data: { archivedAt: new Date() },
			include: { client: true },
		});
		this.notifyQuote(organizationId, 'updated', id, {
			number: updated.number,
			status: updated.status,
		});
		return { success: true, archivedAt: updated.archivedAt };
	}

	async restore(id: string, organizationId?: number) {
		const quote = await this.findOne(id, organizationId);
		if (!quote.archivedAt) {
			return { success: true, alreadyActive: true };
		}
		const updated = await this.prisma.quote.update({
			where: { id },
			data: { archivedAt: null },
			include: { client: true },
		});
		this.notifyQuote(organizationId, 'updated', id, {
			number: updated.number,
			status: updated.status,
		});
		return { success: true };
	}

	async findArchivedGrouped(organizationId?: number) {
		const where: { archivedAt: { not: null }; organizationId?: number } = {
			archivedAt: { not: null },
		};
		if (organizationId) where.organizationId = organizationId;
		const items = await this.prisma.quote.findMany({
			where,
			orderBy: { date: 'desc' },
			include: { client: true },
		});
		return {
			groups: groupByYearAndMonth(items, (q) => q.date),
			total: items.length,
		};
	}

	async remove(id: string, organizationId?: number) {
		return this.archive(id, organizationId);
	}

	private ensureToken(): string {
		return randomBytes(24).toString('hex');
	}

	/**
	 * Envoie un devis (création du token public)
	 * 
	 * Crée un token public unique et une écriture comptable hors-bilan (DRAFT).
	 * 
	 * @param id - ID du devis
	 * @returns URL publique et confirmation
	 * @throws {NotFoundException} Si devis non trouvé
	 */
	async send(id: string, organizationId?: number) {
		const quote = await this.findOne(id, organizationId);
		const token = quote.publicToken ?? this.ensureToken();
		const updated = await this.prisma.quote.update({
			where: { id },
			data: { publicToken: token, status: QuoteStatus.SENT, sentAt: new Date() }
		});
		// Hors-bilan: enregistre une écriture DRAFT dans OD
		try {
			await this.accounting.postEntry({
				journalCode: 'OD',
				reference: `DEV ${updated.number}`,
				memo: 'Devis envoyé (hors-bilan)',
				lines: [
					{ accountCode: '706', credit: Number(updated.subtotal as any) },
					{ accountCode: '44571', credit: Number(updated.tax as any) },
					{ accountCode: '411', debit: Number(updated.total as any) }
				]
			});
		} catch (_) {}
		this.notifyQuote(organizationId ?? updated.organizationId ?? undefined, 'sent', id, {
			number: updated.number,
			status: 'SENT',
		});
		return { ok: true, publicUrl: `/public/quotes/${token}` };
	}

	/**
	 * Visualise un devis via token public
	 * 
	 * Enregistre la visualisation (IP, user agent) pour le tracking.
	 * 
	 * @param token - Token public du devis
	 * @param ip - Adresse IP du visiteur (optionnel)
	 * @param userAgent - User agent du visiteur (optionnel)
	 * @returns Informations du devis
	 * @throws {NotFoundException} Si devis non trouvé
	 */
	async publicView(token: string, ip?: string, userAgent?: string) {
		const quote = await this.prisma.quote.findUnique({
			where: { publicToken: token },
			include: { lines: true, client: true }
		});
		if (!quote) throw new NotFoundException('Devis introuvable');
		await this.prisma.quoteView.create({ data: { quoteId: quote.id, ip: ip || null, userAgent: userAgent || null } });

		// Infos minimales pour guider l'UX publique (sans exposer d'éléments sensibles).
		const orgId = quote.organizationId;
		if (!orgId) return quote;

		const depositTag = this.quoteDepositTag(quote.id);
		const remainderTag = this.quoteRemainderTag(quote.id);
		const [deposit, remainder] = await Promise.all([
			this.prisma.invoice.findFirst({
				where: { organizationId: orgId, tags: { contains: `"${depositTag}"` } },
				select: { id: true, status: true, balance: true },
			}),
			this.prisma.invoice.findFirst({
				where: { organizationId: orgId, tags: { contains: `"${remainderTag}"` } },
				select: { id: true, status: true, balance: true },
			}),
		]);

		const depositPaid = (() => {
			if (!deposit) return false;
			const bal = Number((deposit.balance as any)?.toNumber?.() ?? deposit.balance ?? 0);
			return deposit.status === 'PAID' || bal <= 0;
		})();

		const onlinePaymentAvailable = await this.isInvoiceStripeConfigured(orgId);

		return {
			...quote,
			publicPaymentHints: {
				hasDepositSplit: Boolean(deposit && remainder),
				depositPaid,
				onlinePaymentAvailable,
			},
		};
	}

	/**
	 * Accepte un devis via token public
	 * 
	 * @param token - Token public du devis
	 * @param ip - Adresse IP (optionnel)
	 * @returns Confirmation d'acceptation
	 * @throws {NotFoundException} Si devis non trouvé
	 */
	async publicAccept(token: string, ip?: string) {
		const quote = await this.prisma.quote.findUnique({
			where: { publicToken: token },
			include: { lines: true },
		});
		if (!quote) throw new NotFoundException('Devis introuvable');
		if (quote.status === QuoteStatus.REJECTED) {
			throw new BadRequestException('Ce devis a été refusé');
		}
		if (quote.status === QuoteStatus.EXPIRED) {
			throw new BadRequestException('Ce devis a expiré');
		}

		const accepted = await this.markQuoteAccepted(quote.id, ip);
		const orgId = quote.organizationId;
		if (!orgId) {
			throw new BadRequestException('Organisation manquante pour ce devis');
		}

		let invoice = await this.prisma.invoice.findUnique({
			where: { sourceQuoteId: quote.id },
		});
		if (!invoice) {
			invoice = await this.convertQuoteToInvoice(quote.id, orgId);
		}
		if (!invoice) {
			throw new BadRequestException('Impossible de créer la facture depuis ce devis');
		}
		const sent = await this.sendInvoiceForPublicPayment(invoice.id, invoice, orgId);
		this.notifyQuote(quote.organizationId ?? undefined, 'updated', quote.id, {
			number: quote.number,
			status: 'ACCEPTED',
		});

		const onlinePaymentAvailable = await this.isInvoiceStripeConfigured(orgId);

		return {
			status: 'accepted',
			id: accepted.id,
			invoiceId: invoice.id,
			invoiceNumber: invoice.number,
			invoiceToken: sent.publicToken,
			onlinePaymentAvailable,
			message: onlinePaymentAvailable
				? undefined
				: 'Devis accepté. Le règlement en ligne n’est pas disponible : merci de régler selon les modalités convenues avec votre prestataire.',
		};
	}

	/**
	 * Acceptation publique avec option acompte.
	 * Crée la/les facture(s), les "envoie" (publicToken + sentAt) pour permettre le paiement en ligne,
	 * et renvoie les tokens côté frontend.
	 */
	async publicAcceptWithDeposit(token: string, dto: PublicAcceptDepositDto | undefined, ip?: string) {
		const body = dto ?? { mode: 'FULL' as const };
		const mode = body.mode;
		if (mode !== 'FULL' && mode !== 'DEPOSIT') {
			throw new BadRequestException('mode doit être FULL ou DEPOSIT');
		}

		const quote = await this.prisma.quote.findUnique({
			where: { publicToken: token },
			include: { lines: true },
		});
		if (!quote) throw new NotFoundException('Devis introuvable');
		if (quote.status === QuoteStatus.REJECTED) {
			throw new BadRequestException('Ce devis a été refusé');
		}
		if (quote.status === QuoteStatus.EXPIRED) {
			throw new BadRequestException('Ce devis a expiré');
		}
		if (!quote.organizationId) {
			throw new BadRequestException('Organisation manquante pour ce devis');
		}

		const onlinePaymentAvailable = await this.isInvoiceStripeConfigured(quote.organizationId);
		if (!onlinePaymentAvailable) {
			if (mode === 'DEPOSIT') {
				throw new BadRequestException(
					'Le paiement acompte en ligne n’est pas disponible. Contactez votre prestataire pour régler ce devis.',
				);
			}
			return this.publicAccept(token, ip);
		}

		// Accepte le devis (idempotent)
		await this.markQuoteAccepted(quote.id, ip);
		// Realtime plateforme : mettre à jour la ligne de devis après acceptation publique.
		this.notifyQuote(quote.organizationId ?? undefined, 'updated', quote.id, {
			number: quote.number,
			status: 'ACCEPTED',
		});

		const orgId = quote.organizationId;

		if (mode === 'FULL') {
			// Si un split acompte/solde existe déjà pour ce devis, on interdit le paiement 100%
			// pour éviter les doubles paiements (le client doit payer le solde).
			const depositTag = this.quoteDepositTag(quote.id);
			const remainderTag = this.quoteRemainderTag(quote.id);
			const existingSplit = await this.prisma.invoice.findFirst({
				where: {
					organizationId: orgId,
					OR: [
						{ tags: { contains: `"${depositTag}"` } },
						{ tags: { contains: `"${remainderTag}"` } },
					],
				},
			});
			if (existingSplit) {
				throw new BadRequestException(
					'Un acompte a déjà été créé pour ce devis. Vous ne pouvez plus payer 100% : veuillez régler le solde.',
				);
			}
			return this.publicAcceptFullPayment(quote, orgId);
		}

		const depositRate = body.depositRate ?? 0.1;
		if (depositRate <= 0 || depositRate >= 1) {
			throw new BadRequestException('depositRate doit être compris entre 0 et 1 (ex: 0.1)');
		}

		const depositTag = this.quoteDepositTag(quote.id);
		const remainderTag = this.quoteRemainderTag(quote.id);

		// Cas DEPOSIT : on tente d’abord de réutiliser un split existant.
		const existingDeposit =
			(await this.prisma.invoice.findFirst({
				where: {
					organizationId: orgId,
					sourceQuoteId: quote.id,
					tags: { contains: `"${depositTag}"` },
				},
			})) ??
			(await this.prisma.invoice.findUnique({ where: { sourceQuoteId: quote.id } }));
		const existingRemainder = await this.prisma.invoice.findFirst({
			where: {
				organizationId: orgId,
				tags: { contains: `"${remainderTag}"` },
			},
		});

		if (existingDeposit && existingRemainder && this.isQuoteDepositInvoice(existingDeposit, quote.id)) {
			const depositSent = await this.sendInvoiceForPublicPayment(existingDeposit.id, existingDeposit, orgId);
			const depositFull = await this.prisma.invoice.findUnique({
				where: { id: existingDeposit.id },
				include: { payments: true },
			});
			const depositPaid =
				(depositFull?.status === 'PAID') ||
				Number((depositFull?.balance as any)?.toNumber?.() ?? depositFull?.balance ?? 0) <= 0 ||
				(depositFull?.payments?.length ?? 0) > 0;

			// Si l'acompte est déjà réglé, on permet de payer le solde (envoi public du SOL)
			if (depositPaid) {
				const remainderLink = await this.ensureRemainderPublicPaymentLink(
					existingRemainder.id,
					existingRemainder,
					orgId,
				);
				return {
					status: 'accepted',
					depositInvoiceToken: depositSent.publicToken,
					depositInvoiceNumber: depositSent.number,
					remainderInvoiceToken: remainderLink.publicToken,
					remainderInvoiceNumber: existingRemainder.number,
					message: "Acompte déjà réglé. Vous pouvez maintenant payer le solde.",
				};
			}
			return {
				status: 'accepted',
				depositInvoiceToken: depositSent.publicToken,
				depositInvoiceNumber: depositSent.number,
				remainderInvoiceNumber: existingRemainder.number,
			};
		}

		let depositInvoice =
			existingDeposit && this.isQuoteDepositInvoice(existingDeposit, quote.id)
				? existingDeposit
				: null;
		let remainderInvoice = existingRemainder;

		// Si une facture pleine existe déjà (sourceQuoteId unique) et n'est pas un split acompte,
		// on renvoie cette facture plutôt que de tenter de recréer un split (sinon contrainte unique).
		const existingFullInvoice = await this.prisma.invoice.findUnique({
			where: { sourceQuoteId: quote.id },
		});
		if (existingFullInvoice && !this.isQuoteDepositInvoice(existingFullInvoice, quote.id)) {
			const sent = await this.sendInvoiceForPublicPayment(existingFullInvoice.id, existingFullInvoice, orgId);
			return {
				status: 'accepted',
				invoiceToken: sent.publicToken,
				invoiceNumber: sent.number,
			};
		}

		// Calcul des lignes deposit / remainder (prorata sur unitPrice)
		const linesDeposit = quote.lines.map((l) => ({
			productId: null,
			description: l.description,
			quantity: Number(l.quantity),
			unitPrice: Number(l.unitPrice) * depositRate,
			taxRate: Number(l.taxRate),
		}));
		const linesRemainderRaw = quote.lines.map((l) => ({
			productId: null,
			description: l.description,
			quantity: Number(l.quantity),
			unitPrice: Number(l.unitPrice) * (1 - depositRate),
			taxRate: Number(l.taxRate),
		}));

		// Ajustement rapide du dernier montant pour coller à quote.total (arrondi)
		const quoteTotal = Number(quote.total);
		const depositTotal = Number((quoteTotal * depositRate).toFixed(2));
		const remainderTarget = Number((quoteTotal - depositTotal).toFixed(2));
		const remainderComputed = linesRemainderRaw.reduce((sum, l) => sum + l.quantity * l.unitPrice * (1 + l.taxRate), 0);
		const remainderDiff = Number((remainderTarget - remainderComputed).toFixed(2));
		const last = linesRemainderRaw[linesRemainderRaw.length - 1];
		if (last && Math.abs(remainderDiff) > 0.0001) {
			const denom = last.quantity * (1 + last.taxRate);
			if (denom !== 0) {
				last.unitPrice = Number((last.unitPrice + remainderDiff / denom).toFixed(4));
			}
		}

		const acceptedAt = new Date();
		const depositDue = computeInvoiceDueDate(DEFAULT_DEPOSIT_DUE_POLICY, {
			baseDate: acceptedAt,
			quoteExpiry: quote.expiryDate,
		});
		const remainderDue = computeInvoiceDueDate(DEFAULT_REMAINDER_DUE_POLICY, {
			baseDate: acceptedAt,
			quoteExpiry: quote.expiryDate,
		});
		const depositDueFr = depositDue.toLocaleDateString('fr-FR');
		const remainderDueFr = remainderDue.toLocaleDateString('fr-FR');
		const depositMention = buildDepositCommitmentParagraph(depositDueFr);
		const remainderMention = buildRemainderCommitmentParagraph(remainderDueFr);

		if (!depositInvoice) {
			depositInvoice = await this.invoices.create(
				{
					clientId: quote.clientId,
					sourceQuoteId: quote.id,
					status: 'DRAFT',
					number: await this.invoices.allocateInvoiceNumber('deposit'),
					dueDate: depositDue,
					legalMention: depositMention,
					lines: linesDeposit.map((l) => ({
						productId: undefined,
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate,
					})),
				},
				orgId,
			);
		}

		if (!remainderInvoice) {
			remainderInvoice = await this.invoices.create(
				{
					clientId: quote.clientId,
					status: 'DRAFT',
					number: await this.invoices.allocateInvoiceNumber('remainder'),
					dueDate: remainderDue,
					legalMention: remainderMention,
					lines: linesRemainderRaw.map((l) => ({
						productId: undefined,
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate,
					})),
				},
				orgId,
			);
		}

		if (!depositInvoice || !remainderInvoice) {
			throw new BadRequestException('Impossible de créer les factures d\'acompte pour ce devis');
		}

		// Marquage tags pour le PDF + idempotence split
		const depositTags = serializeTagsJson([
			...parseTagsJson(depositInvoice.tags),
			depositTag,
			'ACOMPTE_10',
		]);
		const remainderTags = serializeTagsJson([
			...parseTagsJson(remainderInvoice.tags),
			remainderTag,
			'SOLDE_APRES_ACOMPTE',
			'PENDING_EMIT',
		]);

		await this.prisma.invoice.update({
			where: { id: depositInvoice.id },
			data: {
				tags: depositTags,
				legalMention:
					depositInvoice.legalMention?.includes('Contrat d\'engagement') ||
					depositInvoice.legalMention?.includes("Contrat d'engagement")
						? depositInvoice.legalMention
						: depositMention,
			},
		});
		await this.prisma.invoice.update({
			where: { id: remainderInvoice.id },
			data: {
				tags: remainderTags,
				legalMention:
					remainderInvoice.legalMention?.includes('contrat d\'engagement') ||
					remainderInvoice.legalMention?.includes("contrat d'engagement")
						? remainderInvoice.legalMention
						: remainderMention,
			},
		});

		const depositSent = await this.sendInvoiceForPublicPayment(depositInvoice.id, depositInvoice, orgId);

		return {
			status: 'accepted',
			depositInvoiceToken: depositSent.publicToken,
			depositInvoiceNumber: depositSent.number,
			remainderInvoiceNumber: remainderInvoice.number,
		};
	}

	/** Accepte un devis (back-office) et crée la facture associée. */
	async acceptQuote(id: string, organizationId?: number) {
		const quote = await this.findOne(id, organizationId);
		if (quote.status === QuoteStatus.REJECTED) {
			throw new BadRequestException('Ce devis a été refusé');
		}
		if (quote.status === QuoteStatus.EXPIRED) {
			throw new BadRequestException('Ce devis a expiré');
		}
		if (quote.status === QuoteStatus.DRAFT) {
			throw new BadRequestException('Envoyez le devis avant de l’accepter');
		}

		await this.markQuoteAccepted(id);
		const invoice = await this.convertQuoteToInvoice(id, organizationId);
		const updated = await this.findOne(id, organizationId);
		this.notifyQuote(organizationId ?? updated.organizationId ?? undefined, 'updated', id, {
			number: updated.number,
			status: 'ACCEPTED',
		});
		return { ...updated, invoiceId: invoice.id, invoiceNumber: invoice.number };
	}

	/** Rejette un devis (back-office). */
	async rejectQuote(id: string, organizationId?: number) {
		const quote = await this.findOne(id, organizationId);
		if (quote.status === QuoteStatus.ACCEPTED) {
			throw new BadRequestException('Devis déjà accepté — impossible de le refuser');
		}
		await this.prisma.quote.update({
			where: { id },
			data: { status: QuoteStatus.REJECTED },
		});
		try {
			await this.contraOffBalanceForQuote(quote.number);
		} catch (_) {}
		this.notifyQuote(organizationId ?? quote.organizationId ?? undefined, 'updated', id, {
			number: quote.number,
			status: 'REJECTED',
		});
		return this.findOne(id, organizationId);
	}

	/**
	 * Crée une facture à partir d’un devis accepté (idempotent si déjà converti).
	 */
	async convertQuoteToInvoice(quoteId: string, organizationId?: number) {
		const existing = await this.prisma.invoice.findUnique({
			where: { sourceQuoteId: quoteId },
			include: { lines: true, client: true },
		});
		if (existing) return existing;

		const quote = await this.prisma.quote.findFirst({
			where: { id: quoteId, ...(organizationId != null ? { organizationId } : {}) },
			include: { lines: true, client: true },
		});
		if (!quote) throw new NotFoundException('Devis introuvable');
		if (quote.status !== QuoteStatus.ACCEPTED) {
			throw new BadRequestException('Le devis doit être accepté avant conversion en facture');
		}

		const orgId = organizationId ?? quote.organizationId ?? undefined;
		if (orgId) {
			const linked = await this.resolveInvoiceLinkedToQuote(
				{ id: quote.id, clientId: quote.clientId, total: quote.total },
				orgId,
			);
			if (linked) {
				const full = await this.prisma.invoice.findUnique({
					where: { id: linked.id },
					include: { lines: true, client: true },
				});
				if (full) return full;
			}
		}

		const dueDate = computeInvoiceDueDate(DEFAULT_STANDARD_DUE_POLICY, {
			baseDate: new Date(),
			quoteExpiry: quote.expiryDate,
		});

		return this.invoices.create(
			{
				clientId: quote.clientId,
				sourceQuoteId: quote.id,
				dueDate,
				// À l'acceptation, on considère la “vente” comme émise (compta à l'émission).
				status: 'SENT',
				lines: quote.lines.map((l) => ({
					productId: l.productId ?? undefined,
					description: l.description,
					quantity: Number(l.quantity),
					unitPrice: Number(l.unitPrice),
					taxRate: Number(l.taxRate),
				})),
			},
			orgId,
		);
	}

	/**
	 * Paye un devis (FULL ou DEPOSIT).
	 * - Accepte le devis si nécessaire
	 * - Convertit en facture (statut SENT)
	 * - Ajoute le paiement sur la facture et réduit la balance
	 */
	async payQuote(
		id: string,
		dto: PayQuoteDto,
		organizationId?: number,
	) {
		const quote = await this.findOne(id, organizationId);
		if (quote.status === QuoteStatus.REJECTED) throw new BadRequestException('Ce devis a été refusé');
		if (quote.status === QuoteStatus.EXPIRED) throw new BadRequestException('Ce devis a expiré');
		if (quote.status === QuoteStatus.DRAFT) throw new BadRequestException('Envoyez le devis avant de le payer');

		// Accepter & convertir si nécessaire.
		let acceptedQuote: any = quote;
		if (quote.status !== QuoteStatus.ACCEPTED) {
			acceptedQuote = await this.acceptQuote(id, organizationId);
		}

		const orgId = organizationId ?? quote.organizationId ?? undefined;

		const paymentAmount = (() => {
			const total = Number(quote.total ?? 0);
			if (dto.mode === 'FULL') return Number(total.toFixed(2));
			const rate = dto.depositRate ?? 0.1;
			if (rate <= 0 || rate >= 1) throw new BadRequestException('depositRate doit être compris entre 0 et 1 (ex: 0.1)');
			return Number((total * rate).toFixed(2));
		})();

		// Vérifier solde restant pour éviter de dépasser.
		const invoice = await this.prisma.invoice.findUnique({
			where: { sourceQuoteId: id },
			include: { payments: true, client: true, lines: true }
		});
		if (!invoice) throw new BadRequestException('Facture introuvable pour le devis');

		// Sécurité : certaines factures anciennes peuvent ne pas avoir d'écriture VE si elles étaient en DRAFT.
		// La méthode est idempotente via la référence.
		try {
			await this.accounting.postInvoiceSale({ invoiceId: invoice.id, date: invoice.date });
		} catch (_) {}

		const alreadyPaid = (invoice.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
		const remaining = Number((Number(invoice.total) - alreadyPaid).toFixed(2));
		if (paymentAmount > remaining + 0.0001) {
			throw new BadRequestException(
				`Le paiement (${paymentAmount}) dépasse le solde restant (${remaining})`,
			);
		}

		const date = dto.date ? new Date(dto.date) : undefined;
		const payment = await this.invoices.addPayment(
			invoice.id,
			paymentAmount,
			date,
			dto.method,
			dto.notes,
			orgId,
		);

		// Normaliser la réponse côté UI (quote + invoice + paiement)
		const quoteOut = { ...acceptedQuote, invoiceId: invoice.id, invoiceNumber: invoice.number };

		return {
			quote: quoteOut,
			invoiceId: invoice.id,
			invoiceNumber: invoice.number,
			paymentId: payment.id,
			paymentAmount,
			remaining: Number((remaining - paymentAmount).toFixed(2)),
		};
	}

	private async markQuoteAccepted(quoteId: string, ip?: string) {
		return this.prisma.quote.update({
			where: { id: quoteId },
			data: {
				status: QuoteStatus.ACCEPTED,
				acceptedAt: new Date(),
				acceptedIp: ip ?? null,
			},
		});
	}

	/**
	 * Rejette un devis via token public
	 * 
	 * Contre-passe automatiquement l'écriture hors-bilan.
	 * 
	 * @param token - Token public du devis
	 * @returns Confirmation de rejet
	 * @throws {NotFoundException} Si devis non trouvé
	 */
	async publicReject(token: string) {
		const quote = await this.prisma.quote.findUnique({ where: { publicToken: token } });
		if (!quote) throw new NotFoundException('Devis introuvable');
		if (quote.status === QuoteStatus.ACCEPTED) {
			throw new BadRequestException('Ce devis est déjà accepté. Vous ne pouvez plus le refuser.');
		}

		// Si un acompte (ou une facture liée) a déjà été payé, on ne permet plus le refus.
		const orgId = quote.organizationId;
		if (orgId) {
			const depositTag = this.quoteDepositTag(quote.id);
			const remainderTag = this.quoteRemainderTag(quote.id);
			const linkedInvoices = await this.prisma.invoice.findMany({
				where: {
					organizationId: orgId,
					OR: [
						{ sourceQuoteId: quote.id },
						{ tags: { contains: `"${depositTag}"` } },
						{ tags: { contains: `"${remainderTag}"` } },
					],
				},
				select: { id: true, status: true, balance: true },
			});
			if (linkedInvoices.length) {
				const ids = linkedInvoices.map((i) => i.id);
				const paidCount = await this.prisma.payment.count({ where: { invoiceId: { in: ids } } });
				const anySettled = linkedInvoices.some((i) => {
					const bal = Number((i.balance as any)?.toNumber?.() ?? i.balance ?? 0);
					return i.status === 'PAID' || bal <= 0;
				});
				if (paidCount > 0 || anySettled) {
					throw new BadRequestException(
						"Ce devis a déjà été réglé (acompte). Vous ne pouvez plus le refuser.",
					);
				}
			}
		}

		await this.prisma.quote.update({ where: { id: quote.id }, data: { status: QuoteStatus.REJECTED } });
		try { await this.contraOffBalanceForQuote(quote.number); } catch (_) {}
		this.notifyQuote(quote.organizationId ?? undefined, 'updated', quote.id, {
			number: quote.number,
			status: 'REJECTED',
		});
		return { ok: true };
	}

	async sendQuote(id: string, organizationId?: number) {
		const quote = await this.findOne(id, organizationId);
		if (!quote) throw new NotFoundException('Quote not found');

		const orgId = quote.organizationId ?? organizationId;
		if (!orgId) {
			throw new BadRequestException('Organisation manquante pour ce devis');
		}

		const publicToken = crypto.randomBytes(32).toString('hex');
		const publicUrl = buildPublicQuoteUrl(publicToken);

		const updated = await this.prisma.quote.update({
			where: { id },
			data: {
				status: 'SENT',
				sentAt: new Date(),
				publicToken
			},
			include: { client: true, lines: true }
		});

		// Hors-bilan: enregistre une écriture DRAFT dans OD (comme dans send)
		try {
			await this.accounting.postEntry({
				journalCode: 'OD',
				reference: `DEV ${updated.number}`,
				memo: 'Devis envoyé (hors-bilan)',
				lines: [
					{ accountCode: '706', credit: Number(updated.subtotal as any) },
					{ accountCode: '44571', credit: Number(updated.tax as any) },
					{ accountCode: '411', debit: Number(updated.total as any) }
				]
			});
		} catch (_) {}

		this.notifyQuote(organizationId ?? updated.organizationId ?? undefined, 'sent', id, {
			number: updated.number,
			status: 'SENT',
		});
		return { ...updated, publicUrl };
	}
}


