import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as crypto from 'crypto';
import { AccountingService } from '../accounting/accounting.service';
import { buildPublicQuoteUrl } from '../common/public-app-url';
import { InvoicesService } from '../invoices/invoices.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { groupByYearAndMonth } from '../common/archive-group.util';
import {
	buildDocumentFolderWhere,
	documentFolderOrderBy,
	parseTagsJson,
	serializeTagsJson,
} from '../common/document-folder.util';
import type { QuoteListQueryDto } from './dto/quote-document-folder.dto';
import type { UpdateQuoteDocumentFlagsDto } from './dto/quote-document-folder.dto';

/**
 * Ligne de devis
 */
export interface QuoteLineDto {
	/** Référence produit (optionnel, pour devis par sélection de produits) */
	productId?: number | null;
	/** Description de la ligne */
	description: string;
	/** Quantité */
	quantity: number;
	/** Prix unitaire (HT) */
	unitPrice: number;
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
	clientId: number;
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
	clientId?: number;
	/** Date d'expiration */
	expiryDate?: string | Date | null;
	/** Statut du devis */
	status?: QuoteStatus;
	/** Lignes de devis */
	lines?: QuoteLineDto[];
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
		private readonly realtime: RealtimeEventsService,
	) {}

	private notifyQuote(
		organizationId: number | undefined,
		action: 'created' | 'updated' | 'deleted' | 'sent' | 'paid',
		id: number,
		meta?: { number?: string; status?: string },
	): void {
		if (organizationId) this.realtime.emit(organizationId, 'quotes', action, id, meta);
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
			const base = l.quantity * l.unitPrice;
			const rate = l.taxRate ?? 0;
			subtotal += base;
			tax += base * rate;
		}
		return { subtotal, tax, total: subtotal + tax };
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
		const counter = await this.prisma.counter.upsert({
			where: { scope },
			create: { scope, current: 1 },
			update: { current: { increment: 1 } }
		});
		const padded = String(counter.current).padStart(4, '0');
		return `DEV-${year}-${padded}`;
	}

	/**
	 * Crée un nouveau devis
	 * 
	 * @param data - Données du devis
	 * @returns Devis créé avec lignes et client
	 * @throws {BadRequestException} Si validation échoue
	 */
	async create(data: CreateQuoteDto, organizationId?: number) {
		// Validation
		if (!data.clientId) {
			throw new BadRequestException('Client requis');
		}
		const lines = data.lines ?? [];
		if (lines.length === 0) {
			throw new BadRequestException('Au moins une ligne est requise');
		}
		for (const l of lines) {
			if (l.quantity <= 0) throw new BadRequestException('Quantite invalide');
			if (l.unitPrice < 0) throw new BadRequestException('Prix unitaire invalide');
		}
		
		// Vérifier que le client existe
		const client = await this.prisma.client.findUnique({
			where: { id: data.clientId },
			select: { organizationId: true }
		});
		if (!client) {
			throw new NotFoundException(`Client avec l'ID ${data.clientId} introuvable`);
		}
		
		// Récupérer l'organizationId depuis le client si non fourni
		let orgId = organizationId;
		if (!orgId) {
			if (client.organizationId !== null) {
				orgId = client.organizationId;
			}
		}
		
		// S'assurer qu'on a un organizationId valide
		if (!orgId) {
			throw new BadRequestException('OrganizationId requis. Le client doit être associé à une organisation.');
		}
		
		// Vérifier que l'organisation existe
		const organization = await this.prisma.organization.findUnique({
			where: { id: orgId }
		});
		if (!organization) {
			throw new NotFoundException(`Organisation avec l'ID ${orgId} introuvable`);
		}
		
		const totals = this.computeTotals(lines);
		const number = data.number ?? (await this.nextQuoteNumber());
		const created = await this.prisma.quote.create({
			data: {
				number,
				clientId: data.clientId,
				organizationId: orgId,
				expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
				status: data.status ?? QuoteStatus.DRAFT,
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				lines: {
					create: lines.map(l => ({
						productId: l.productId ?? undefined,
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate ?? 0,
						taxAmount: l.quantity * l.unitPrice * (l.taxRate ?? 0),
						total: l.quantity * l.unitPrice * (1 + (l.taxRate ?? 0))
					}))
				}
			},
			include: { lines: true, client: true }
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
	findAll(organizationId?: number, query?: QuoteListQueryDto) {
		const where: Record<string, unknown> = { archivedAt: null };
		if (organizationId != null) where.organizationId = organizationId;
		Object.assign(where, buildDocumentFolderWhere(query?.folder, new Date(), 'quote'));
		if (query?.tag?.trim()) {
			where.tags = { contains: `"${query.tag.trim()}"` };
		}
		if (query?.search) {
			where.OR = [
				{ number: { contains: query.search } },
				{ client: { name: { contains: query.search } } },
			];
		}
		return this.prisma.quote.findMany({
			where: where as any,
			orderBy: query?.folder
				? documentFolderOrderBy('quote')
				: { createdAt: 'desc' },
			include: { lines: true, client: true },
		});
	}

	async getFolderCounts(organizationId?: number) {
		const base: { organizationId?: number; archivedAt: null } = { archivedAt: null };
		if (organizationId) base.organizationId = organizationId;
		const now = new Date();
		const count = (extra: Record<string, unknown>) =>
			this.prisma.quote.count({ where: { ...base, ...extra } });

		const [inbox, nouveau, suivi, attente, important, envoyes, brouillons] =
			await Promise.all([
				count(buildDocumentFolderWhere('inbox', now, 'quote')),
				count(buildDocumentFolderWhere('nouveau', now, 'quote')),
				count(buildDocumentFolderWhere('suivi', now, 'quote')),
				count(buildDocumentFolderWhere('attente', now, 'quote')),
				count(buildDocumentFolderWhere('important', now, 'quote')),
				count(buildDocumentFolderWhere('envoyes', now, 'quote')),
				count(buildDocumentFolderWhere('brouillons', now, 'quote')),
			]);

		return { inbox, nouveau, suivi, attente, important, envoyes, brouillons };
	}

	async updateDocumentFlags(
		id: number,
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
	async findOne(id: number, organizationId?: number) {
		const where: { id: number; organizationId?: number } = { id };
		if (organizationId != null) where.organizationId = organizationId;
		const quote = await this.prisma.quote.findFirst({
			where,
			include: { lines: true, client: true }
		});
		if (!quote) throw new NotFoundException('Devis non trouve');
		return quote;
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
	async update(id: number, data: UpdateQuoteDto, organizationId?: number) {
		await this.findOne(id, organizationId);
		const lines = data.lines ?? [];
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
					create: lines.map(l => ({
						productId: l.productId ?? undefined,
						description: l.description,
						quantity: l.quantity,
						unitPrice: l.unitPrice,
						taxRate: l.taxRate ?? 0,
						taxAmount: l.quantity * l.unitPrice * (l.taxRate ?? 0),
						total: l.quantity * l.unitPrice * (1 + (l.taxRate ?? 0))
					}))
				}
			},
			include: { lines: true, client: true }
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

	async archive(id: number, organizationId?: number) {
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

	async restore(id: number, organizationId?: number) {
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

	async remove(id: number, organizationId?: number) {
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
	async send(id: number, organizationId?: number) {
		const quote = await this.findOne(id, organizationId);
		const token = quote.publicToken ?? this.ensureToken();
		const updated = await this.prisma.quote.update({
			where: { id },
			data: { publicToken: token, status: QuoteStatus.SENT, sentAt: new Date() }
		});
		await this.prisma.emailEvent.create({ data: { quoteId: id, type: 'sent' } });
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
		return quote;
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
		const invoice = await this.convertQuoteToInvoice(quote.id, quote.organizationId ?? undefined);
		this.notifyQuote(quote.organizationId ?? undefined, 'updated', quote.id, {
			number: quote.number,
			status: 'ACCEPTED',
		});

		return {
			status: 'accepted',
			id: accepted.id,
			invoiceId: invoice.id,
			invoiceNumber: invoice.number,
		};
	}

	/** Accepte un devis (back-office) et crée la facture associée. */
	async acceptQuote(id: number, organizationId?: number) {
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
	async rejectQuote(id: number, organizationId?: number) {
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
	async convertQuoteToInvoice(quoteId: number, organizationId?: number) {
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
		return this.invoices.create(
			{
				clientId: quote.clientId,
				sourceQuoteId: quote.id,
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

	private async markQuoteAccepted(quoteId: number, ip?: string) {
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
		await this.prisma.quote.update({ where: { id: quote.id }, data: { status: QuoteStatus.REJECTED } });
		try { await this.contraOffBalanceForQuote(quote.number); } catch (_) {}
		this.notifyQuote(quote.organizationId ?? undefined, 'updated', quote.id, {
			number: quote.number,
			status: 'REJECTED',
		});
		return { ok: true };
	}

	async sendQuote(id: number, organizationId?: number) {
		const quote = await this.findOne(id, organizationId);
		if (!quote) throw new NotFoundException('Quote not found');

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

		await this.prisma.emailEvent.create({ data: { quoteId: id, type: 'sent' } });

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


