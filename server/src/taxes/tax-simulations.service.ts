import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaxesService } from './taxes.service';
import { TaxDeductionsService } from './tax-deductions.service';
import { AmortizationsService } from './amortizations.service';
import { TaxCreditsService } from './tax-credits.service';

/**
 * Résultat d'une simulation fiscale
 */
export interface TaxSimulationResult {
	/** Scénario simulé */
	scenario: 'CURRENT' | 'OPTIMIZED' | 'CUSTOM';
	/** Année fiscale */
	year: number;
	/** Données d'entrée */
	input: {
		revenue: number;
		expenses: number;
		deductions: number;
		amortizations: number;
		credits: number;
	};
	/** Résultats */
	results: {
		taxableIncome: number;
		corporateTax: number;
		cfe: number;
		totalTax: number;
		effectiveRate: number;
	};
	/** Optimisations suggérées */
	optimizations: Array<{
		type: string;
		description: string;
		potentialSavings: number;
	}>;
}

/**
 * Service de simulation fiscale
 * 
 * Gère :
 * - La simulation de scénarios fiscaux (actuel, optimisé, personnalisé)
 * - La comparaison de scénarios
 * - Les suggestions d'optimisation
 * - Le calcul des économies potentielles
 * 
 * @see TaxSimulationsController pour les endpoints API
 */
@Injectable()
export class TaxSimulationsService {
	constructor(
		private readonly prisma: PrismaService,
		@Inject(forwardRef(() => TaxesService))
		private readonly taxesService: TaxesService,
		@Inject(forwardRef(() => TaxDeductionsService))
		private readonly deductionsService: TaxDeductionsService,
		@Inject(forwardRef(() => AmortizationsService))
		private readonly amortizationsService: AmortizationsService,
		@Inject(forwardRef(() => TaxCreditsService))
		private readonly creditsService: TaxCreditsService
	) {}

	/**
	 * Simule un scénario fiscal
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param year - Année fiscale
	 * @param scenario - Type de scénario (CURRENT, OPTIMIZED, CUSTOM)
	 * @param customData - Données personnalisées (pour CUSTOM)
	 * @returns Résultat de la simulation
	 */
	async simulate(
		organizationId: number,
		year: number,
		scenario: 'CURRENT' | 'OPTIMIZED' | 'CUSTOM' = 'CURRENT',
		customData?: {
			revenue?: number;
			expenses?: number;
			deductions?: number;
			amortizations?: number;
			credits?: number;
		}
	): Promise<TaxSimulationResult> {
		// Récupérer les données réelles si CURRENT
		let revenue = 0;
		let expenses = 0;
		let deductions = 0;
		let amortizations = 0;
		let credits = 0;

		if (scenario === 'CURRENT' || scenario === 'OPTIMIZED') {
			// Calculer depuis les factures de l'année
			const startDate = new Date(year, 0, 1);
			const endDate = new Date(year, 11, 31, 23, 59, 59);

			const invoices = await this.prisma.invoice.findMany({
				where: {
					organizationId,
					date: { gte: startDate, lte: endDate },
					status: { in: ['PAID', 'SENT'] },
				},
			});

			revenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

			// Récupérer les déductions validées
			const deductionsTotal = await this.deductionsService.getTotalDeductions(organizationId, year);
			deductions = deductionsTotal.total;

			// Récupérer les amortissements
			const amortizationsTotal = await this.amortizationsService.getTotalAmortizations(organizationId, year);
			amortizations = amortizationsTotal.total;

			// Récupérer les crédits d'impôt
			const creditsTotal = await this.creditsService.getTotalCredits(organizationId, year);
			credits = creditsTotal.total;

			// Pour les charges, on peut estimer depuis les écritures comptables
			// Pour l'instant, on utilise une estimation basée sur le CA
			expenses = revenue * 0.6; // Estimation : 60% du CA en charges
		} else if (scenario === 'CUSTOM' && customData) {
			revenue = customData.revenue || 0;
			expenses = customData.expenses || 0;
			deductions = customData.deductions || 0;
			amortizations = customData.amortizations || 0;
			credits = customData.credits || 0;
		}

		// Calculer l'IS
		const isResult = await this.taxesService.calculateIS({
			year,
			revenue,
			expenses: expenses - deductions - amortizations, // Charges nettes des déductions
			fiscalDeductions: deductions + amortizations,
		});

		// Calculer la CFE (estimation)
		const cfeResult = await this.taxesService.calculateCFE({
			year,
			revenue,
			activity: 'SERVICE',
		});

		// Total des impôts
		const totalTax = isResult.corporateTax + cfeResult.amount - credits;
		const effectiveRate = revenue > 0 ? (totalTax / revenue) * 100 : 0;

		// Générer des suggestions d'optimisation
		const optimizations = this.generateOptimizations(
			organizationId,
			year,
			revenue,
			expenses,
			deductions,
			amortizations,
			credits
		);

		const result: TaxSimulationResult = {
			scenario,
			year,
			input: {
				revenue: Math.round(revenue * 100) / 100,
				expenses: Math.round(expenses * 100) / 100,
				deductions: Math.round(deductions * 100) / 100,
				amortizations: Math.round(amortizations * 100) / 100,
				credits: Math.round(credits * 100) / 100,
			},
			results: {
				taxableIncome: isResult.taxableIncome,
				corporateTax: Math.round(isResult.corporateTax * 100) / 100,
				cfe: cfeResult.amount,
				totalTax: Math.round(Math.max(0, totalTax) * 100) / 100,
				effectiveRate: Math.round(effectiveRate * 100) / 100,
			},
			optimizations,
		};

		// Sauvegarder la simulation
		await this.prisma.taxSimulation.create({
			data: {
				organizationId,
				scenario,
				year,
				revenue: result.input.revenue,
				expenses: result.input.expenses,
				deductions: result.input.deductions,
				amortizations: result.input.amortizations,
				credits: result.input.credits,
				taxableIncome: result.results.taxableIncome,
				corporateTax: result.results.corporateTax,
				cfe: result.results.cfe,
				totalTax: result.results.totalTax,
				effectiveRate: result.results.effectiveRate,
				optimizations: optimizations as any,
			},
		});

		return result;
	}

	/**
	 * Génère des suggestions d'optimisation fiscale
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param year - Année fiscale
	 * @param revenue - Chiffre d'affaires
	 * @param expenses - Charges
	 * @param deductions - Déductions actuelles
	 * @param amortizations - Amortissements actuels
	 * @param credits - Crédits d'impôt actuels
	 * @returns Liste des optimisations suggérées
	 * @private
	 */
	private generateOptimizations(
		organizationId: number,
		year: number,
		revenue: number,
		expenses: number,
		deductions: number,
		amortizations: number,
		credits: number
	): Array<{ type: string; description: string; potentialSavings: number }> {
		const optimizations: Array<{ type: string; description: string; potentialSavings: number }> = [];

		// Suggestion 1 : Augmenter les déductions (si < 10% du CA)
		if (deductions < revenue * 0.1) {
			const potentialDeductions = revenue * 0.1 - deductions;
			const savings = potentialDeductions * 0.28; // Taux IS moyen
			optimizations.push({
				type: 'DEDUCTIONS',
				description: `Augmenter les déductions fiscales de ${Math.round(potentialDeductions)}€`,
				potentialSavings: Math.round(savings * 100) / 100,
			});
		}

		// Suggestion 2 : Crédit d'impôt R&D (si pas de crédits)
		if (credits === 0 && revenue > 50000) {
			const potentialRnd = revenue * 0.05; // 5% du CA en R&D
			const cirCredit = potentialRnd * 0.3; // 30% de crédit
			optimizations.push({
				type: 'CIR',
				description: `Développer des activités R&D pour bénéficier du CIR (${Math.round(cirCredit)}€ de crédit)`,
				potentialSavings: Math.round(cirCredit * 100) / 100,
			});
		}

		// Suggestion 3 : Amortissements (si pas d'amortissements)
		if (amortizations === 0 && revenue > 100000) {
			const potentialAmortization = 10000; // Investissement de 10k€
			const savings = potentialAmortization * 0.28; // Taux IS moyen
			optimizations.push({
				type: 'AMORTIZATION',
				description: `Investir dans du matériel amortissable (économies potentielles: ${Math.round(savings)}€)`,
				potentialSavings: Math.round(savings * 100) / 100,
			});
		}

		// Suggestion 4 : Optimisation rémunération (si bénéfice > 75k€)
		const profit = revenue - expenses;
		if (profit > 75000) {
			const excess = profit - 75000;
			const savings = excess * 0.03; // Différence entre IS 31% et charges sociales ~28%
			optimizations.push({
				type: 'COMPENSATION',
				description: `Optimiser la rémunération (salaire vs dividendes) pour économiser ${Math.round(savings)}€`,
				potentialSavings: Math.round(savings * 100) / 100,
			});
		}

		return optimizations;
	}

	/**
	 * Compare deux scénarios fiscaux
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param year - Année fiscale
	 * @returns Comparaison CURRENT vs OPTIMIZED
	 */
	async compareScenarios(organizationId: number, year: number) {
		const current = await this.simulate(organizationId, year, 'CURRENT');
		const optimized = await this.simulate(organizationId, year, 'OPTIMIZED');

		const savings = current.results.totalTax - optimized.results.totalTax;
		const savingsPercent = current.results.totalTax > 0
			? (savings / current.results.totalTax) * 100
			: 0;

		return {
			current,
			optimized,
			comparison: {
				taxSavings: Math.round(savings * 100) / 100,
				savingsPercent: Math.round(savingsPercent * 100) / 100,
				effectiveRateDiff: optimized.results.effectiveRate - current.results.effectiveRate,
			},
		};
	}

	/**
	 * Liste les simulations sauvegardées
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param year - Année fiscale (optionnel)
	 * @returns Liste des simulations
	 */
	async findAll(organizationId: number, year?: number) {
		const where: any = { organizationId };
		if (year) {
			where.year = year;
		}

		return this.prisma.taxSimulation.findMany({
			where,
			orderBy: { createdAt: 'desc' },
		});
	}
}

