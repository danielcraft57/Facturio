import {
	Injectable,
	NotFoundException,
	BadRequestException,
	ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { CreateAmortizationDto } from './dto/create-amortization.dto';

/**
 * Service de gestion des amortissements
 *
 * Gère :
 * - Le calcul des amortissements (linéaire, dégressif, exceptionnel)
 * - La génération des tableaux d'amortissement
 * - Le suivi des biens amortissables
 * - Le calcul des montants déductibles par année
 * - La comptabilisation des dotations (681 / 281)
 *
 * @see AmortizationsController pour les endpoints API
 */
@Injectable()
export class AmortizationsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly accounting: AccountingService,
	) {}

	/**
	 * Crée un nouvel amortissement et calcule le tableau
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param data - Données de l'amortissement
	 * @returns Amortissement créé avec tableau calculé
	 */
	async create(organizationId: number, data: CreateAmortizationDto) {
		// Validation
		if (data.purchaseAmount <= 0) {
			throw new BadRequestException('Le montant d\'achat doit être positif');
		}

		if (data.residualValue && data.residualValue >= data.purchaseAmount) {
			throw new BadRequestException('La valeur résiduelle doit être inférieure au montant d\'achat');
		}

		const purchaseDate = new Date(data.purchaseDate);
		const startYear = purchaseDate.getFullYear();

		// Calculer le tableau d'amortissement
		const schedule = this.calculateSchedule(
			data.purchaseAmount,
			data.residualValue || 0,
			data.method,
			data.duration,
			data.coefficient,
			startYear
		);

		const endYear = startYear + data.duration - 1;

		return this.prisma.amortization.create({
			data: {
				organizationId,
				assetName: data.assetName,
				assetDescription: data.assetDescription,
				purchaseDate,
				purchaseAmount: data.purchaseAmount,
				residualValue: data.residualValue || 0,
				method: data.method,
				duration: data.duration,
				coefficient: data.coefficient,
				startYear,
				endYear,
				schedule: schedule as any,
			},
		});
	}

	/**
	 * Calcule le tableau d'amortissement
	 * 
	 * @param purchaseAmount - Montant d'achat
	 * @param residualValue - Valeur résiduelle
	 * @param method - Méthode (LINEAR, DECLINING, EXCEPTIONAL)
	 * @param duration - Durée en années
	 * @param coefficient - Coefficient pour dégressif (optionnel)
	 * @param startYear - Année de début
	 * @returns Tableau d'amortissement
	 * @private
	 */
	private calculateSchedule(
		purchaseAmount: number,
		residualValue: number,
		method: string,
		duration: number,
		coefficient?: number,
		startYear?: number
	): Array<{ year: number; amount: number; cumulativeAmount: number; remainingValue: number }> {
		const base = purchaseAmount - residualValue;
		const schedule: Array<{ year: number; amount: number; cumulativeAmount: number; remainingValue: number }> = [];
		let cumulativeAmount = 0;
		let remainingValue = purchaseAmount;

		if (method === 'LINEAR') {
			// Amortissement linéaire : montant constant chaque année
			const annualAmount = base / duration;

			for (let i = 0; i < duration; i++) {
				const year = startYear ? startYear + i : i + 1;
				cumulativeAmount += annualAmount;
				remainingValue = purchaseAmount - cumulativeAmount;
				schedule.push({
					year,
					amount: Math.round(annualAmount * 100) / 100,
					cumulativeAmount: Math.round(cumulativeAmount * 100) / 100,
					remainingValue: Math.round(remainingValue * 100) / 100,
				});
			}
		} else if (method === 'DECLINING') {
			// Amortissement dégressif : taux dégressif appliqué sur la valeur nette
			const linearRate = 1 / duration;
			const decliningRate = linearRate * (coefficient || 1.75);
			const minRate = 1 / duration; // Taux minimum (linéaire)

			for (let i = 0; i < duration; i++) {
				const year = startYear ? startYear + i : i + 1;
				// Utiliser le taux dégressif ou le taux linéaire (le plus élevé)
				const rate = Math.max(decliningRate, minRate);
				// Calculer sur la valeur nette comptable
				const annualAmount = remainingValue * rate;

				// Pour la dernière année, amortir le reste
				if (i === duration - 1) {
					const finalAmount = remainingValue - residualValue;
					cumulativeAmount += finalAmount;
					remainingValue = residualValue;
					schedule.push({
						year,
						amount: Math.round(finalAmount * 100) / 100,
						cumulativeAmount: Math.round(cumulativeAmount * 100) / 100,
						remainingValue: Math.round(remainingValue * 100) / 100,
					});
				} else {
					cumulativeAmount += annualAmount;
					remainingValue = purchaseAmount - cumulativeAmount;
					schedule.push({
						year,
						amount: Math.round(annualAmount * 100) / 100,
						cumulativeAmount: Math.round(cumulativeAmount * 100) / 100,
						remainingValue: Math.round(remainingValue * 100) / 100,
					});
				}
			}
		} else {
			// EXCEPTIONAL : amortissement complet la première année
			const year = startYear || 1;
			const annualAmount = base;
			cumulativeAmount = annualAmount;
			remainingValue = residualValue;
			schedule.push({
				year,
				amount: Math.round(annualAmount * 100) / 100,
				cumulativeAmount: Math.round(cumulativeAmount * 100) / 100,
				remainingValue: Math.round(remainingValue * 100) / 100,
			});
		}

		return schedule;
	}

	/**
	 * Liste les amortissements
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param year - Année fiscale (optionnel, pour filtrer)
	 * @returns Liste des amortissements
	 */
	async findAll(organizationId: number, year?: number) {
		const where: any = { organizationId };
		if (year) {
			where.startYear = { lte: year };
			where.OR = [{ endYear: null }, { endYear: { gte: year } }];
		}

		return this.prisma.amortization.findMany({
			where,
			orderBy: { startYear: 'desc' },
		});
	}

	/**
	 * Récupère un amortissement par ID
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param id - ID de l'amortissement
	 * @returns Amortissement trouvé
	 * @throws {NotFoundException} Si amortissement non trouvé
	 */
	async findOne(organizationId: number, id: number) {
		const amortization = await this.prisma.amortization.findFirst({
			where: { id, organizationId },
		});

		if (!amortization) {
			throw new NotFoundException('Amortissement non trouvé');
		}

		return amortization;
	}

	/**
	 * Calcule le total des amortissements pour une année
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param year - Année fiscale
	 * @returns Total des amortissements de l'année
	 */
	async getTotalAmortizations(organizationId: number, year: number) {
		const amortizations = await this.prisma.amortization.findMany({
			where: {
				organizationId,
				startYear: { lte: year },
				OR: [{ endYear: null }, { endYear: { gte: year } }],
			},
		});

		let total = 0;
		const byAsset: Array<{ assetName: string; amount: number }> = [];

		for (const am of amortizations) {
			const schedule = am.schedule as any;
			if (Array.isArray(schedule)) {
				const yearEntry = schedule.find((s: any) => s.year === year);
				if (yearEntry) {
					const amount = Number(yearEntry.amount);
					total += amount;
					byAsset.push({
						assetName: am.assetName,
						amount: Math.round(amount * 100) / 100,
					});
				}
			}
		}

		return {
			year,
			total: Math.round(total * 100) / 100,
			count: amortizations.length,
			byAsset,
		};
	}

	/**
	 * Référence unique d'une écriture de dotation.
	 * @param amortizationId - Identifiant amortissement
	 * @param year - Année fiscale
	 */
	private amortizationEntryReference(amortizationId: number, year: number): string {
		return `AMO-${amortizationId}-${year}`;
	}

	/**
	 * Montant de dotation pour une année donnée depuis le schedule.
	 * @param amortization - Amortissement avec schedule JSON
	 * @param year - Année
	 */
	private amountForYear(
		amortization: { schedule: unknown; assetName: string },
		year: number,
	): number {
		const schedule = amortization.schedule as Array<{ year: number; amount: number }> | null;
		if (!Array.isArray(schedule)) {
			throw new BadRequestException(`Pas de tableau d'amortissement pour ${amortization.assetName}`);
		}
		const entry = schedule.find((s) => s.year === year);
		if (!entry || Number(entry.amount) <= 0) {
			throw new BadRequestException(`Aucune dotation pour ${amortization.assetName} en ${year}`);
		}
		return Math.round(Number(entry.amount) * 100) / 100;
	}

	/**
	 * Poste l'écriture de dotation 681/281 pour un bien et une année (idempotent).
	 * @param organizationId - Organisation
	 * @param id - Identifiant amortissement
	 * @param year - Année fiscale
	 * @returns Écriture créée ou déjà existante
	 */
	async postYearToAccounting(organizationId: number, id: number, year: number) {
		const amortization = await this.findOne(organizationId, id);
		const amount = this.amountForYear(amortization, year);
		const reference = this.amortizationEntryReference(id, year);

		const existing = await this.prisma.journalEntry.findFirst({
			where: { reference, status: 'POSTED', organizationId },
		});
		if (existing) {
			throw new ConflictException(`Dotation ${year} déjà comptabilisée (${reference})`);
		}

		const entry = await this.accounting.postEntry({
			organizationId,
			journalCode: 'OD',
			date: new Date(year, 11, 31),
			reference,
			memo: `Dotation amortissement ${amortization.assetName} ${year}`,
			lines: [
				{
					accountCode: '681',
					debit: amount,
					credit: 0,
					description: `Dotation ${amortization.assetName}`,
				},
				{
					accountCode: '281',
					debit: 0,
					credit: amount,
					description: `Amort. ${amortization.assetName}`,
				},
			],
		});

		return {
			amortizationId: id,
			year,
			amount,
			reference,
			entryId: entry.id,
		};
	}

	/**
	 * Comptabilise toutes les dotations de l'année pour l'organisation.
	 * @param organizationId - Organisation
	 * @param year - Année fiscale
	 */
	async postAllYearToAccounting(organizationId: number, year: number) {
		const list = await this.findAll(organizationId, year);
		const posted: Array<{ amortizationId: number; amount: number; reference: string }> = [];
		const skipped: Array<{ amortizationId: number; reason: string }> = [];

		for (const am of list) {
			try {
				const result = await this.postYearToAccounting(organizationId, am.id, year);
				posted.push({
					amortizationId: result.amortizationId,
					amount: result.amount,
					reference: result.reference,
				});
			} catch (err) {
				skipped.push({
					amortizationId: am.id,
					reason: (err as Error).message || 'Erreur',
				});
			}
		}

		return {
			year,
			postedCount: posted.length,
			skippedCount: skipped.length,
			posted,
			skipped,
			totalAmount: Math.round(posted.reduce((s, p) => s + p.amount, 0) * 100) / 100,
		};
	}

	/**
	 * Supprime un amortissement
	 *
	 * @param organizationId - ID de l'organisation
	 * @param id - ID de l'amortissement
	 * @returns Confirmation de suppression
	 */
	async remove(organizationId: number, id: number) {
		await this.findOne(organizationId, id);
		await this.prisma.amortization.delete({ where: { id } });
		return { success: true };
	}
}

