import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CreateAvoirDto } from './dto/create-avoir.dto';
import { UpdateAvoirDto } from './dto/update-avoir.dto';
import { ApplyAvoirDto } from './dto/apply-avoir.dto';
import { AccountingService } from '../accounting/accounting.service';
import { ConfigService } from '../config/config.service';
import { EmailService } from '../common/email.service';

/**
 * Ligne d'avoir
 */
export interface AvoirLineInput {
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
 * Service de gestion des avoirs
 * 
 * Gère :
 * - La création d'avoirs avec numérotation automatique
 * - Le calcul automatique des totaux (HT, TVA, TTC)
 * - L'imputation d'avoirs sur des factures
 * - La comptabilisation automatique (écritures comptables)
 * - Le suivi du solde disponible
 * 
 * @see AvoirsController pour les endpoints API
 */
@Injectable()
export class AvoirsService {
	private readonly logger = new Logger(AvoirsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly accounting: AccountingService,
		private readonly config: ConfigService,
		private readonly email: EmailService,
	) {}

	/**
	 * Calcule les totaux d'un avoir (HT, TVA, TTC)
	 * 
	 * @param lines - Lignes d'avoir
	 * @returns Totaux calculés
	 * @private
	 */
	private async computeTotals(lines: AvoirLineInput[] = []) {
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
	 * Génère le prochain numéro d'avoir
	 * 
	 * Format : AVO-YYYY-NNNN (ex: AVO-2024-0001)
	 * Utilise un compteur par année.
	 * 
	 * @returns Numéro d'avoir unique
	 * @private
	 */
	private async nextAvoirNumber(): Promise<string> {
		const year = new Date().getFullYear();
		const scope = `avoir-${year}`;
		const counter = await this.prisma.counter.upsert({
			where: { scope },
			create: { scope, current: 1 },
			update: { current: { increment: 1 } }
		});
		const padded = String(counter.current).padStart(4, '0');
		return `AVO-${year}-${padded}`;
	}

	async create(data: CreateAvoirDto, organizationId?: number) {
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

		// Vérifier que le client existe et appartient à l'organisation
		const client = await this.prisma.client.findUnique({ where: { id: data.clientId } });
		if (!client) {
			throw new NotFoundException('Client introuvable');
		}
		if (organizationId != null && client.organizationId !== organizationId) {
			throw new NotFoundException('Client introuvable');
		}
		if (!client.organizationId) {
			throw new BadRequestException('Le client doit appartenir à une organisation');
		}

		let linkedInvoice:
			| {
					id: string;
					clientId: string;
					total: unknown;
					status: string;
			  }
			| null = null;

		// Vérifier que la facture existe si fournie
		if (data.invoiceId) {
			linkedInvoice = await this.prisma.invoice.findUnique({ where: { id: data.invoiceId } });
			if (!linkedInvoice) {
				throw new NotFoundException('Facture introuvable');
			}
			if (linkedInvoice.status === 'CANCELLED') {
				throw new BadRequestException('Impossible de créer un avoir sur une facture déjà annulée');
			}
			if (linkedInvoice.clientId !== data.clientId) {
				throw new BadRequestException('La facture doit appartenir au même client');
			}
		}

		// Calculer les totaux
		const defaultTaxRate = await this.getDefaultTaxRate();
		const linesWithTax = lines.map(l => ({ ...l, taxRate: l.taxRate ?? defaultTaxRate }));
		const totals = await this.computeTotals(linesWithTax);
		const number = data.number ?? (await this.nextAvoirNumber());

		const createData = {
			number,
			clientId: data.clientId,
			organizationId: client.organizationId,
			date: data.date ? new Date(data.date) : new Date(),
			status: data.status ?? 'DRAFT',
			currency: data.currency ?? 'EUR',
			legalMention: data.memo,
			subtotal: totals.subtotal,
			tax: totals.tax,
			total: totals.total,
			appliedAmount: 0,
			lines: {
				create: linesWithTax.map(l => ({
					description: l.description,
					quantity: l.quantity,
					unitPrice: l.unitPrice,
					taxRate: l.taxRate,
					taxAmount: l.quantity * l.unitPrice * l.taxRate,
					total: l.quantity * l.unitPrice * (1 + l.taxRate)
				}))
			},
			...(data.invoiceId !== undefined && {
				invoiceId: data.invoiceId ?? null
			})
		};

		const created = await this.prisma.avoir.create({
			data: createData,
			include: {
				lines: true,
				client: true,
				invoice: true,
				applications: {
					include: {
						invoice: true
					}
				}
			}
		});

		// Créer l'écriture comptable si le statut est SENT ou APPLIED
		if (created.status === 'SENT' || created.status === 'APPLIED') {
			try {
				await this.createAccountingEntry(created.id);
			} catch (error) {
				// Log l'erreur mais ne bloque pas la création de l'avoir
				console.error('Erreur lors de la création de l\'écriture comptable:', error);
			}
		}

		// Règle métier: un avoir lié couvrant 100% de la facture l'annule automatiquement.
		if (linkedInvoice && linkedInvoice.status !== 'CANCELLED') {
			const invoiceTotal = Number(linkedInvoice.total);
			if (totals.total >= invoiceTotal - 0.01) {
				await this.prisma.invoice.update({
					where: { id: linkedInvoice.id },
					data: {
						status: 'CANCELLED',
						balance: 0,
					},
				});
			}
		}

		await this.sendAvoirNotification(created);

		return this.formatAvoir(created);
	}

	private async sendAvoirNotification(avoir: {
		id: number;
		invoiceId?: string | null;
		invoice?: { number?: string | null } | null;
		client?: { email?: string | null; name?: string | null; companyName?: string | null } | null;
		total: unknown;
		legalMention?: string | null;
	}) {
		try {
			const clientEmail = avoir.client?.email?.trim?.();
			if (!clientEmail) return;
			const type = `invoice_credit_notified:${avoir.id}`;
			const exists = await this.prisma.emailEvent.findFirst({
				where: { invoiceId: avoir.invoiceId ?? null, type },
			});
			if (exists) return;

			const clientName =
				avoir.client?.companyName?.trim?.() ||
				avoir.client?.name?.trim?.() ||
				'Client';

			await this.email.sendInvoiceCreditedToClient({
				to: clientEmail,
				clientName,
				invoiceNumber: avoir.invoice?.number ?? `#${avoir.invoiceId ?? avoir.id}`,
				creditedAmount: Number(avoir.total),
				reason: avoir.legalMention ?? null,
				issuerName: 'Votre prestataire',
			});

			await this.prisma.emailEvent.create({
				data: {
					invoiceId: avoir.invoiceId ?? null,
					type,
					meta: { avoirId: avoir.id },
				},
			});
		} catch (err) {
			this.logger.warn(`Email avoir ${avoir.id}: ${(err as Error).message}`);
		}
	}

	async findAll(query: ListQueryDto, organizationId?: number) {
		const page = parseInt(String(query.page || 1), 10);
		const pageSize = parseInt(String(query.pageSize || 20), 10);
		const skip = (page - 1) * pageSize;

		const where: any = {};
		if (organizationId != null) where.organizationId = organizationId;
		const clientId = (query as { clientId?: string }).clientId?.trim();
		if (clientId) where.clientId = clientId;
		if (query.search) {
			where.OR = [
				{ number: { contains: query.search, mode: 'insensitive' } },
				{ client: { name: { contains: query.search, mode: 'insensitive' } } }
			];
		}

		// Note: Le filtrage par status peut être ajouté via query.search si nécessaire

		const [data, total] = await Promise.all([
			this.prisma.avoir.findMany({
				where,
				skip,
				take: pageSize,
				orderBy: query.sortBy
					? { [query.sortBy]: query.order || 'asc' }
					: { createdAt: 'desc' },
				include: {
					client: true,
					invoice: true,
					applications: {
						include: {
							invoice: true
						}
					}
				}
			}),
			this.prisma.avoir.count({ where })
		]);

		return {
			data: data.map(avoir => this.formatAvoir(avoir)),
			pagination: {
				page,
				pageSize,
				total,
				totalPages: Math.ceil(total / pageSize)
			}
		};
	}

	async findOne(id: number, organizationId?: number) {
		const where: { id: number; organizationId?: number } = { id };
		if (organizationId != null) where.organizationId = organizationId;
		const avoir = await this.prisma.avoir.findFirst({
			where,
			include: {
				lines: true,
				client: true,
				invoice: true,
				applications: {
					include: {
						invoice: true
					}
				}
			}
		});

		if (!avoir) {
			throw new NotFoundException(`Avoir ${id} introuvable`);
		}

		return this.formatAvoir(avoir);
	}

	async update(id: number, data: UpdateAvoirDto, organizationId?: number) {
		await this.findOne(id, organizationId);

		const lines = data.lines ?? [];
		if (lines.length > 0) {
			for (const l of lines) {
				if (l.quantity <= 0) throw new BadRequestException('Quantite invalide');
				if (l.unitPrice < 0) throw new BadRequestException('Prix unitaire invalide');
			}
		}

		// Vérifier que le client existe si fourni
		if (data.clientId) {
			const client = await this.prisma.client.findUnique({ where: { id: data.clientId } });
			if (!client) {
				throw new NotFoundException('Client introuvable');
			}
		}

		// Vérifier que la facture existe si fournie
		if (data.invoiceId !== undefined) {
			if (data.invoiceId !== null) {
				const invoice = await this.prisma.invoice.findUnique({ where: { id: data.invoiceId } });
				if (!invoice) {
					throw new NotFoundException('Facture introuvable');
				}
				const clientId = data.clientId ?? (await this.prisma.avoir.findUnique({ where: { id } }))!.clientId;
				if (invoice.clientId !== clientId) {
					throw new BadRequestException('La facture doit appartenir au même client');
				}
			}
		}

		const current = await this.prisma.avoir.findUnique({ where: { id }, include: { lines: true } });
		if (!current) {
			throw new NotFoundException(`Avoir ${id} introuvable`);
		}

		// Recalculer les totaux si les lignes changent
		let totals = {
			subtotal: (current.subtotal as any)?.toNumber?.() ?? Number(current.subtotal),
			tax: (current.tax as any)?.toNumber?.() ?? Number(current.tax),
			total: (current.total as any)?.toNumber?.() ?? Number(current.total)
		};

		if (lines.length > 0) {
			const defaultTaxRate = await this.getDefaultTaxRate();
			const linesWithTax = lines.map(l => ({ ...l, taxRate: l.taxRate ?? defaultTaxRate }));
			totals = await this.computeTotals(linesWithTax);
		}

		const updated = await this.prisma.avoir.update({
			where: { id },
			data: {
				number: data.number,
				clientId: data.clientId,
				invoiceId: data.invoiceId !== undefined ? data.invoiceId : undefined,
				date: data.date ? new Date(data.date) : undefined,
				status: data.status,
				currency: data.currency,
				legalMention: data.memo,
				subtotal: totals.subtotal,
				tax: totals.tax,
				total: totals.total,
				lines: lines.length > 0
					? {
							deleteMany: {},
							create: await Promise.all(
								lines.map(async (l) => {
									const taxRate = l.taxRate ?? (await this.getDefaultTaxRate());
									return {
										description: l.description,
										quantity: l.quantity,
										unitPrice: l.unitPrice,
										taxRate,
										taxAmount: l.quantity * l.unitPrice * taxRate,
										total: l.quantity * l.unitPrice * (1 + taxRate)
									};
								})
							)
						}
					: undefined
			},
			include: {
				lines: true,
				client: true,
				invoice: true,
				applications: {
					include: {
						invoice: true
					}
				}
			}
		});

		return this.formatAvoir(updated);
	}

	async remove(id: number, organizationId?: number) {
		const avoir = await this.findOne(id, organizationId);

		// Vérifier qu'il n'y a pas d'imputations
		if (avoir.applications && avoir.applications.length > 0) {
			throw new BadRequestException('Impossible de supprimer un avoir avec des imputations');
		}

		await this.prisma.avoir.delete({ where: { id } });
		return { success: true };
	}

	async apply(avoirId: number, data: ApplyAvoirDto, organizationId?: number) {
		const avoir = await this.findOne(avoirId, organizationId);

		if (avoir.status === 'CANCELLED') {
			throw new BadRequestException('Impossible d\'imputer un avoir annulé');
		}

		const invoice = await this.prisma.invoice.findUnique({ where: { id: data.invoiceId } });
		if (!invoice) {
			throw new NotFoundException('Facture introuvable');
		}

		if (invoice.clientId !== avoir.clientId) {
			throw new BadRequestException('La facture doit appartenir au même client que l\'avoir');
		}

		const avoirTotal = (avoir.total as any)?.toNumber?.() ?? Number(avoir.total);
		const appliedAmount = (avoir.appliedAmount as any)?.toNumber?.() ?? Number(avoir.appliedAmount || 0);
		const availableAmount = avoirTotal - appliedAmount;

		if (data.amount > availableAmount) {
			throw new BadRequestException(`Montant disponible insuffisant (${availableAmount} disponible)`);
		}

		const invoiceBalance = (invoice.balance as any)?.toNumber?.() ?? Number(invoice.balance);
		if (invoiceBalance <= 0) {
			throw new BadRequestException('La facture ne présente aucun solde à imputer');
		}
		// Sécurité métier : ne jamais dépasser le solde de la facture.
		// Si l'utilisateur saisit un montant trop élevé, on l'écrête automatiquement.
		const amountToApply = Math.min(data.amount, invoiceBalance);
		if (amountToApply <= 0) {
			throw new BadRequestException('Montant d\'imputation invalide');
		}

		// Créer l'imputation
		await this.prisma.avoirApplication.create({
			data: {
				avoirId: avoirId,
				invoiceId: data.invoiceId,
				amount: amountToApply
			}
		});

		// Mettre à jour le montant imputé de l'avoir
		const newAppliedAmount = appliedAmount + amountToApply;
		const newStatus = newAppliedAmount >= avoirTotal ? 'APPLIED' : avoir.status === 'DRAFT' ? 'SENT' : avoir.status;

		const updated = await this.prisma.avoir.update({
			where: { id: avoirId },
			data: {
				appliedAmount: newAppliedAmount,
				status: newStatus
			}
		});

		// Créer l'écriture comptable si le statut passe à SENT ou APPLIED et qu'elle n'existe pas encore
		if ((newStatus === 'SENT' || newStatus === 'APPLIED') && !updated.accountingEntryId) {
			try {
				await this.createAccountingEntry(avoirId);
			} catch (error) {
				console.error('Erreur lors de la création de l\'écriture comptable:', error);
			}
		}

		// Recalcul du solde facture (TTC − encaissements − toutes imputations)
		const payments = await this.prisma.payment.findMany({ where: { invoiceId: data.invoiceId } });
		const refunds = await this.prisma.refund.findMany({
			where: { invoiceId: data.invoiceId, status: 'COMPLETED' },
		});
		const appliedAgg = await this.prisma.avoirApplication.aggregate({
			where: { invoiceId: data.invoiceId },
			_sum: { amount: true },
		});
		const grossTotal = Number(invoice.total);
		const netPaid =
			payments.reduce((s, p) => s + Number(p.amount), 0) -
			refunds.reduce((s, r) => s + Number(r.amount), 0);
		const appliedTotal = Number(appliedAgg._sum.amount ?? 0);
		const newInvoiceBalance = Math.max(0, Number((grossTotal - netPaid - appliedTotal).toFixed(2)));
		const newInvoiceStatus = newInvoiceBalance <= 0.01 ? 'PAID' : invoice.status;

		await this.prisma.invoice.update({
			where: { id: data.invoiceId },
			data: {
				balance: newInvoiceBalance,
				status: newInvoiceStatus,
			},
		});

		return this.findOne(avoirId);
	}

	private async getDefaultTaxRate(): Promise<number> {
		const def = await this.prisma.taxRate.findFirst({ where: { isDefault: true } });
		if (!def) {
			return this.config.defaultVatRate;
		}
		const value = (def.rate as any)?.toNumber?.() ?? Number(def.rate);
		return value || this.config.defaultVatRate;
	}

	private async createAccountingEntry(avoirId: number) {
		const avoir = await this.prisma.avoir.findUnique({
			where: { id: avoirId },
			include: { lines: true, client: true }
		});

		if (!avoir || avoir.accountingEntryId) {
			return; // Déjà comptabilisé ou avoir introuvable
		}

		const subtotal = (avoir.subtotal as any)?.toNumber?.() ?? Number(avoir.subtotal);
		const tax = (avoir.tax as any)?.toNumber?.() ?? Number(avoir.tax);
		const total = (avoir.total as any)?.toNumber?.() ?? Number(avoir.total);

		// Écriture comptable pour un avoir (inverse d'une vente)
		// Débit : 411 (Clients) pour le montant TTC
		// Crédit : 706 (Prestations de services) pour le montant HT
		// Crédit : 44571 (TVA collectée) pour le montant de TVA
		const entry = await this.accounting.postEntry({
			journalCode: 'VE',
			date: avoir.date,
			reference: avoir.number,
			memo: `Avoir ${avoir.number} - ${avoir.client.name}`,
			lines: [
				{
					accountCode: '411',
					description: `Avoir ${avoir.number}`,
					debit: total,
					credit: 0
				},
				{
					accountCode: '706',
					description: `Avoir ${avoir.number}`,
					debit: 0,
					credit: subtotal
				},
				{
					accountCode: '44571',
					description: `TVA avoir ${avoir.number}`,
					debit: 0,
					credit: tax
				}
			]
		});

		// Lier l'écriture comptable à l'avoir
		await this.prisma.avoir.update({
			where: { id: avoirId },
			data: { accountingEntryId: entry.id }
		});
	}

	private formatAvoir(avoir: any) {
		const total = (avoir.total as any)?.toNumber?.() ?? Number(avoir.total);
		const appliedAmount = (avoir.appliedAmount as any)?.toNumber?.() ?? Number(avoir.appliedAmount || 0);
		return {
			...avoir,
			subtotal: (avoir.subtotal as any)?.toNumber?.() ?? Number(avoir.subtotal),
			tax: (avoir.tax as any)?.toNumber?.() ?? Number(avoir.tax),
			total,
			appliedAmount,
			balance: total - appliedAmount,
			memo: avoir.legalMention,
			lines: avoir.lines?.map((l: any) => ({
				...l,
				unitPrice: (l.unitPrice as any)?.toNumber?.() ?? Number(l.unitPrice),
				taxRate: (l.taxRate as any)?.toNumber?.() ?? Number(l.taxRate),
				taxAmount: (l.taxAmount as any)?.toNumber?.() ?? Number(l.taxAmount),
				total: (l.total as any)?.toNumber?.() ?? Number(l.total)
			})),
			applications: avoir.applications?.map((a: any) => ({
				...a,
				amount: (a.amount as any)?.toNumber?.() ?? Number(a.amount)
			}))
		};
	}
}

