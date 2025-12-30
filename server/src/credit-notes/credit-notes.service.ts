import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';
import { ApplyCreditNoteDto } from './dto/apply-credit-note.dto';
import { AccountingService } from '../accounting/accounting.service';

/**
 * Ligne d'avoir
 */
export interface CreditNoteLineInput {
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
 * Service de gestion des avoirs (notes de crédit)
 * 
 * Gère :
 * - La création d'avoirs avec numérotation automatique
 * - Le calcul automatique des totaux (HT, TVA, TTC)
 * - L'imputation d'avoirs sur des factures
 * - La comptabilisation automatique (écritures comptables)
 * - Le suivi du solde disponible
 * 
 * @see CreditNotesController pour les endpoints API
 */
@Injectable()
export class CreditNotesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly accounting: AccountingService
	) {}

	/**
	 * Calcule les totaux d'un avoir (HT, TVA, TTC)
	 * 
	 * @param lines - Lignes d'avoir
	 * @returns Totaux calculés
	 * @private
	 */
	private async computeTotals(lines: CreditNoteLineInput[] = []) {
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
	private async nextCreditNoteNumber(): Promise<string> {
		const year = new Date().getFullYear();
		const scope = `credit-note-${year}`;
		const counter = await this.prisma.counter.upsert({
			where: { scope },
			create: { scope, current: 1 },
			update: { current: { increment: 1 } }
		});
		const padded = String(counter.current).padStart(4, '0');
		return `AVO-${year}-${padded}`;
	}

	async create(data: CreateCreditNoteDto) {
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
		const client = await this.prisma.client.findUnique({ where: { id: data.clientId } });
		if (!client) {
			throw new NotFoundException('Client introuvable');
		}

		// Vérifier que la facture existe si fournie
		if (data.invoiceId) {
			const invoice = await this.prisma.invoice.findUnique({ where: { id: data.invoiceId } });
			if (!invoice) {
				throw new NotFoundException('Facture introuvable');
			}
			if (invoice.clientId !== data.clientId) {
				throw new BadRequestException('La facture doit appartenir au même client');
			}
		}

		// Calculer les totaux
		const defaultTaxRate = await this.getDefaultTaxRate();
		const linesWithTax = lines.map(l => ({ ...l, taxRate: l.taxRate ?? defaultTaxRate }));
		const totals = await this.computeTotals(linesWithTax);
		const number = data.number ?? (await this.nextCreditNoteNumber());

		const createData: any = {
			number,
			clientId: data.clientId,
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
			}
		};

		if (data.invoiceId !== undefined) {
			createData.invoiceId = data.invoiceId ?? null;
		}

		const created = await this.prisma.creditNote.create({
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

		return this.formatCreditNote(created);
	}

	async findAll(query: ListQueryDto) {
		const page = parseInt(String(query.page || 1), 10);
		const pageSize = parseInt(String(query.pageSize || 20), 10);
		const skip = (page - 1) * pageSize;

		const where: any = {};

		if (query.search) {
			where.OR = [
				{ number: { contains: query.search, mode: 'insensitive' } },
				{ client: { name: { contains: query.search, mode: 'insensitive' } } }
			];
		}

		// Note: Le filtrage par status peut être ajouté via query.search si nécessaire

		const [data, total] = await Promise.all([
			this.prisma.creditNote.findMany({
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
			this.prisma.creditNote.count({ where })
		]);

		return {
			data: data.map(cn => this.formatCreditNote(cn)),
			pagination: {
				page,
				pageSize,
				total,
				totalPages: Math.ceil(total / pageSize)
			}
		};
	}

	async findOne(id: number) {
		const creditNote = await this.prisma.creditNote.findUnique({
			where: { id },
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

		if (!creditNote) {
			throw new NotFoundException(`Avoir ${id} introuvable`);
		}

		return this.formatCreditNote(creditNote);
	}

	async update(id: number, data: UpdateCreditNoteDto) {
		await this.findOne(id);

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
				const clientId = data.clientId ?? (await this.prisma.creditNote.findUnique({ where: { id } }))!.clientId;
				if (invoice.clientId !== clientId) {
					throw new BadRequestException('La facture doit appartenir au même client');
				}
			}
		}

		const current = await this.prisma.creditNote.findUnique({ where: { id }, include: { lines: true } });
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

		const updated = await this.prisma.creditNote.update({
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

		return this.formatCreditNote(updated);
	}

	async remove(id: number) {
		const creditNote = await this.findOne(id);

		// Vérifier qu'il n'y a pas d'imputations
		if (creditNote.applications && creditNote.applications.length > 0) {
			throw new BadRequestException('Impossible de supprimer un avoir avec des imputations');
		}

		await this.prisma.creditNote.delete({ where: { id } });
		return { success: true };
	}

	async apply(creditNoteId: number, data: ApplyCreditNoteDto) {
		const creditNote = await this.findOne(creditNoteId);

		if (creditNote.status === 'CANCELLED') {
			throw new BadRequestException('Impossible d\'imputer un avoir annulé');
		}

		const invoice = await this.prisma.invoice.findUnique({ where: { id: data.invoiceId } });
		if (!invoice) {
			throw new NotFoundException('Facture introuvable');
		}

		if (invoice.clientId !== creditNote.clientId) {
			throw new BadRequestException('La facture doit appartenir au même client que l\'avoir');
		}

		const creditNoteTotal = (creditNote.total as any)?.toNumber?.() ?? Number(creditNote.total);
		const appliedAmount = (creditNote.appliedAmount as any)?.toNumber?.() ?? Number(creditNote.appliedAmount || 0);
		const availableAmount = creditNoteTotal - appliedAmount;

		if (data.amount > availableAmount) {
			throw new BadRequestException(`Montant disponible insuffisant (${availableAmount} disponible)`);
		}

		const invoiceBalance = (invoice.balance as any)?.toNumber?.() ?? Number(invoice.balance);
		if (data.amount > invoiceBalance) {
			throw new BadRequestException(`Montant supérieur au solde de la facture (${invoiceBalance})`);
		}

		// Créer l'imputation
		await this.prisma.creditNoteApplication.create({
			data: {
				creditNoteId,
				invoiceId: data.invoiceId,
				amount: data.amount
			}
		});

		// Mettre à jour le montant imputé de l'avoir
		const newAppliedAmount = appliedAmount + data.amount;
		const newStatus = newAppliedAmount >= creditNoteTotal ? 'APPLIED' : creditNote.status === 'DRAFT' ? 'SENT' : creditNote.status;

		const updated = await this.prisma.creditNote.update({
			where: { id: creditNoteId },
			data: {
				appliedAmount: newAppliedAmount,
				status: newStatus
			}
		});

		// Créer l'écriture comptable si le statut passe à SENT ou APPLIED et qu'elle n'existe pas encore
		if ((newStatus === 'SENT' || newStatus === 'APPLIED') && !updated.accountingEntryId) {
			try {
				await this.createAccountingEntry(creditNoteId);
			} catch (error) {
				console.error('Erreur lors de la création de l\'écriture comptable:', error);
			}
		}

		// Mettre à jour le solde de la facture
		const newInvoiceBalance = invoiceBalance - data.amount;
		const newInvoiceStatus = newInvoiceBalance <= 0 ? 'PAID' : invoice.status;

		await this.prisma.invoice.update({
			where: { id: data.invoiceId },
			data: {
				balance: newInvoiceBalance,
				status: newInvoiceStatus
			}
		});

		return this.findOne(creditNoteId);
	}

	private async getDefaultTaxRate(): Promise<number> {
		const def = await this.prisma.taxRate.findFirst({ where: { isDefault: true } });
		if (!def) {
			return 0.2;
		}
		const value = (def.rate as any)?.toNumber?.() ?? Number(def.rate);
		return value || 0.2;
	}

	private async createAccountingEntry(creditNoteId: number) {
		const creditNote = await this.prisma.creditNote.findUnique({
			where: { id: creditNoteId },
			include: { lines: true, client: true }
		});

		if (!creditNote || creditNote.accountingEntryId) {
			return; // Déjà comptabilisé ou avoir introuvable
		}

		const subtotal = (creditNote.subtotal as any)?.toNumber?.() ?? Number(creditNote.subtotal);
		const tax = (creditNote.tax as any)?.toNumber?.() ?? Number(creditNote.tax);
		const total = (creditNote.total as any)?.toNumber?.() ?? Number(creditNote.total);

		// Écriture comptable pour un avoir (inverse d'une vente)
		// Débit : 411 (Clients) pour le montant TTC
		// Crédit : 706 (Prestations de services) pour le montant HT
		// Crédit : 44571 (TVA collectée) pour le montant de TVA
		const entry = await this.accounting.postEntry({
			journalCode: 'VE',
			date: creditNote.date,
			reference: creditNote.number,
			memo: `Avoir ${creditNote.number} - ${creditNote.client.name}`,
			lines: [
				{
					accountCode: '411',
					description: `Avoir ${creditNote.number}`,
					debit: total,
					credit: 0
				},
				{
					accountCode: '706',
					description: `Avoir ${creditNote.number}`,
					debit: 0,
					credit: subtotal
				},
				{
					accountCode: '44571',
					description: `TVA avoir ${creditNote.number}`,
					debit: 0,
					credit: tax
				}
			]
		});

		// Lier l'écriture comptable à l'avoir
		await this.prisma.creditNote.update({
			where: { id: creditNoteId },
			data: { accountingEntryId: entry.id }
		});
	}

	private formatCreditNote(cn: any) {
		const total = (cn.total as any)?.toNumber?.() ?? Number(cn.total);
		const appliedAmount = (cn.appliedAmount as any)?.toNumber?.() ?? Number(cn.appliedAmount || 0);
		return {
			...cn,
			subtotal: (cn.subtotal as any)?.toNumber?.() ?? Number(cn.subtotal),
			tax: (cn.tax as any)?.toNumber?.() ?? Number(cn.tax),
			total,
			appliedAmount,
			balance: total - appliedAmount,
			memo: cn.legalMention,
			lines: cn.lines?.map((l: any) => ({
				...l,
				unitPrice: (l.unitPrice as any)?.toNumber?.() ?? Number(l.unitPrice),
				taxRate: (l.taxRate as any)?.toNumber?.() ?? Number(l.taxRate),
				taxAmount: (l.taxAmount as any)?.toNumber?.() ?? Number(l.taxAmount),
				total: (l.total as any)?.toNumber?.() ?? Number(l.total)
			})),
			applications: cn.applications?.map((a: any) => ({
				...a,
				amount: (a.amount as any)?.toNumber?.() ?? Number(a.amount)
			}))
		};
	}
}

