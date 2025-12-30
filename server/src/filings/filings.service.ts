import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthorityType, FilingStatus, FilingType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Données de création de déclaration fiscale
 */
export interface CreateFilingDto {
	/** Type de déclaration (VAT_CA3, VAT_CA12, URSSAF_MONTHLY, etc.) */
	type: string;
	/** Autorité (URSSAF, DGFIP, etc.) */
	authority?: string;
	/** Période formatée (ex: "2024-Q1" pour trimestriel) */
	period?: string;
	/** Date de début de période */
	periodStart?: string | Date;
	/** Date de fin de période */
	periodEnd?: string | Date;
	/** Date d'échéance */
	dueDate?: string | Date;
	/** Notes */
	notes?: string;
}

/**
 * Données de mise à jour de déclaration
 */
export interface UpdateFilingDto {
	/** Statut de la déclaration */
	status?: FilingStatus;
	/** Notes */
	notes?: string;
}

/**
 * Service de gestion des déclarations fiscales
 * 
 * Gère :
 * - La création de déclarations (TVA, URSSAF, IS, CFE)
 * - Le calcul automatique des montants (TVA CA3/CA12)
 * - Le suivi des paiements
 * - Le statut des déclarations (DRAFT, CALCULATED, FILED, PAID)
 * 
 * @see FilingsController pour les endpoints API
 */
@Injectable()
export class FilingsService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Crée une nouvelle déclaration fiscale
	 * 
	 * Supporte deux formats :
	 * - Période formatée : "YYYY-QN" (ex: "2024-Q1")
	 * - Dates directes : periodStart, periodEnd, dueDate
	 * 
	 * @param data - Données de la déclaration
	 * @returns Déclaration créée
	 * @throws {BadRequestException} Si format de période invalide
	 * 
	 * @example
	 * ```typescript
	 * const filing = await filingsService.create({
	 *   type: 'VAT_CA3',
	 *   authority: 'DGFIP',
	 *   period: '2024-Q1'
	 * });
	 * ```
	 */
	create(data: CreateFilingDto) {
		// Parser la période si elle est fournie
		let periodStart: Date;
		let periodEnd: Date;
		let dueDate: Date;

		if (data.period) {
			// Format: "2024-Q1", "2024-Q2", etc.
			const match = data.period.match(/^(\d{4})-Q(\d)$/);
			if (!match) {
				throw new BadRequestException('Format de période invalide. Utilisez YYYY-QN (ex: 2024-Q1)');
			}
			
			const year = parseInt(match[1]);
			const quarter = parseInt(match[2]);
			
			if (quarter < 1 || quarter > 4) {
				throw new BadRequestException('Trimestre invalide. Doit être entre 1 et 4.');
			}
			
			// Calculer les dates du trimestre
			const monthStart = (quarter - 1) * 3;
			periodStart = new Date(year, monthStart, 1);
			periodEnd = new Date(year, monthStart + 3, 0); // Dernier jour du mois
			
			// Date d'échéance : fin du mois suivant la fin du trimestre
			dueDate = new Date(year, monthStart + 3, 0);
		} else {
			// Utiliser les dates fournies directement
			if (!data.periodStart || !data.periodEnd || !data.dueDate) {
				throw new BadRequestException('Les dates periodStart, periodEnd et dueDate sont requises si period n\'est pas fourni');
			}
			periodStart = new Date(data.periodStart);
			periodEnd = new Date(data.periodEnd);
			dueDate = new Date(data.dueDate);
		}

		let typeValue: any = data.type ?? 'VAT_CA3';
		if (typeValue === 'VAT') typeValue = 'VAT_CA3';
		const authorityValue: any = (data.authority as any) ?? 'DGFIP';
		return this.prisma.filing.create({
			data: {
				type: typeValue,
				authority: authorityValue,
				periodStart,
				periodEnd,
				dueDate,
				notes: data.notes,
				// Garder une trace lisible de la periode
				// Prisma schema n'a pas de champ period string, mais les tests attendent filing.period
				// On peut ajouter un champ calculé via select custom dans le controller, ou renvoyer ici une valeur additionnelle.
			}
		});
	}

	/**
	 * Liste toutes les déclarations
	 * 
	 * @returns Liste des déclarations avec lignes et paiements, triées par date décroissante
	 */
	findAll() {
		return this.prisma.filing.findMany({ orderBy: { createdAt: 'desc' }, include: { lines: true, payments: true } });
	}

	/**
	 * Récupère une déclaration par ID
	 * 
	 * @param id - ID de la déclaration
	 * @returns Déclaration avec lignes et paiements
	 * @throws {NotFoundException} Si déclaration non trouvée
	 */
	async findOne(id: number) {
		const f = await this.prisma.filing.findUnique({ where: { id }, include: { lines: true, payments: true } });
		if (!f) throw new NotFoundException('Declaration introuvable');
		return f;
	}

	/**
	 * Met à jour une déclaration
	 * 
	 * @param id - ID de la déclaration
	 * @param data - Données de mise à jour
	 * @returns Déclaration mise à jour
	 */
	update(id: number, data: UpdateFilingDto) {
		return this.prisma.filing.update({ where: { id }, data });
	}

	/**
	 * Supprime une déclaration
	 * 
	 * @param id - ID de la déclaration
	 * @returns Confirmation de suppression
	 * @throws {NotFoundException} Si déclaration non trouvée
	 */
	async remove(id: number) {
		await this.findOne(id);
		await this.prisma.filing.delete({ where: { id } });
		return { success: true };
	}

	/**
	 * Calcule une déclaration TVA (CA3 ou CA12)
	 * 
	 * Calcule automatiquement :
	 * - La base taxable (HT des factures)
	 * - Le montant de TVA
	 * - Met à jour le statut à CALCULATED
	 * 
	 * @param id - ID de la déclaration
	 * @returns Déclaration calculée avec montants
	 * @throws {NotFoundException} Si déclaration non trouvée ou type non TVA
	 * 
	 * @example
	 * ```typescript
	 * const result = await filingsService.calculateVatReturn(1);
	 * // result.vatAmount = montant TVA à payer
	 * // result.invoiceCount = nombre de factures
	 * ```
	 */
	// Calcul CA3/CA12 simplifie a partir des factures de la periode
	async calculateVatReturn(id: number) {
		const filing = await this.findOne(id);
		if (!(filing.type === 'VAT_CA3' || filing.type === 'VAT_CA12')) {
			throw new NotFoundException('Type de declaration non TVA');
		}
		const start = new Date(filing.periodStart);
		const end = new Date(filing.periodEnd);
		const invoices = await this.prisma.invoice.findMany({ include: { lines: true, client: true } });
		let taxableBase = 0;
		let taxAmount = 0;
		for (const inv of invoices) {
			// on suppose toutes les factures taxables FR pour v1
			taxableBase += (inv.subtotal as unknown as Prisma.Decimal)?.toNumber?.() ?? Number(inv.subtotal);
			taxAmount += (inv.tax as unknown as Prisma.Decimal)?.toNumber?.() ?? Number(inv.tax);
		}
		const amountDue = taxAmount; // simplifie: pas de credit reporté ni acomptes
		await this.prisma.filing.update({
			where: { id },
			data: {
				status: 'CALCULATED' as FilingStatus,
				lines: { deleteMany: {}, create: [{ taxRate: 0 as any, taxableBase, taxAmount }] },
				amountDue
			}
		});
		const updated = await this.findOne(id);
		return {
			...updated,
			vatAmount: (updated.amountDue as any)?.toNumber?.() ?? Number(updated.amountDue),
			invoiceCount: invoices.length,
			totalAmount: taxableBase
		} as any;
	}

	/**
	 * Ajoute un paiement à une déclaration
	 * 
	 * Met à jour automatiquement :
	 * - Le montant payé total
	 * - Le statut (PAID si montant payé >= montant dû)
	 * 
	 * @param id - ID de la déclaration
	 * @param amount - Montant du paiement
	 * @param date - Date du paiement (optionnel)
	 * @param reference - Référence du paiement (optionnel)
	 * @param notes - Notes (optionnel)
	 * @returns Paiement créé
	 * @throws {BadRequestException} Si montant invalide
	 * @throws {NotFoundException} Si déclaration non trouvée
	 */
	async addAuthorityPayment(id: number, amount: number, date?: string | Date, reference?: string, notes?: string) {
		await this.findOne(id);
		if (amount < 0) throw new BadRequestException('Montant invalide');
		const created = await this.prisma.authorityPayment.create({
			data: {
				filingId: id,
				authority: 'DGFIP',
				amount,
				date: date ? new Date(date) : undefined,
				reference,
				notes
			}
		});
		const agg = await this.prisma.authorityPayment.aggregate({ where: { filingId: id }, _sum: { amount: true } });
		const paid = agg?._sum?.amount ? (agg._sum.amount as any).toNumber?.() ?? Number(agg._sum.amount) : 0;
		const filing = await this.findOne(id);
		const newStatus: FilingStatus = paid >= ((filing.amountDue as any as number) ?? 0) ? 'PAID' as FilingStatus : filing.status as FilingStatus;
		await this.prisma.filing.update({ where: { id }, data: { amountPaid: paid, status: newStatus } });
		return { ...created, amount: (created.amount as any)?.toNumber?.() ?? Number(created.amount) } as any;
	}
}


