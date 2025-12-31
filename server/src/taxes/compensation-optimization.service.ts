import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

/**
 * Résultat de l'optimisation de rémunération
 */
export interface CompensationOptimizationResult {
	/** Montant total de rémunération */
	totalAmount: number;
	/** Scénario salaire */
	salary: {
		grossSalary: number;
		employeeContrib: number; // Part salariale
		employerContrib: number; // Part patronale
		netSalary: number;
		totalCost: number; // Coût total employeur
	};
	/** Scénario dividendes */
	dividends: {
		grossDividends: number;
		corporateTax: number; // IS sur les bénéfices
		flatTax: number; // Flat tax 30% sur dividendes
		netDividends: number;
		totalCost: number; // Coût total (IS + flat tax)
	};
	/** Recommandation */
	recommendation: {
		bestOption: 'SALARY' | 'DIVIDENDS' | 'MIXED';
		savings: number;
		explanation: string;
	};
}

/**
 * Service d'optimisation de rémunération
 * 
 * Compare les coûts et avantages de :
 * - Rémunération par salaire (charges sociales + impôts)
 * - Rémunération par dividendes (IS + flat tax 30%)
 * - Mixte (combinaison optimale)
 * 
 * @see CompensationOptimizationController pour les endpoints API
 */
@Injectable()
export class CompensationOptimizationService {
	constructor(private readonly config: ConfigService) {}

	/**
	 * Taux de charges sociales - depuis .env
	 */
	private get SOCIAL_RATES() {
		return {
			employee: this.config.socialRateEmployee,
			employer: this.config.socialRateEmployer,
		};
	}

	/**
	 * Taux d'imposition sur le revenu (barème progressif simplifié) - depuis .env
	 */
	private get INCOME_TAX_BRACKETS() {
		return [
			{ min: 0, max: this.config.irThresholdTranche1, rate: this.config.irRateTranche1 },
			{ min: this.config.irThresholdTranche1, max: this.config.irThresholdTranche2, rate: this.config.irRateTranche2 },
			{ min: this.config.irThresholdTranche2, max: this.config.irThresholdTranche3, rate: this.config.irRateTranche3 },
			{ min: this.config.irThresholdTranche3, max: this.config.irThresholdTranche4, rate: this.config.irRateTranche4 },
			{ min: this.config.irThresholdTranche4, max: Infinity, rate: this.config.irRateTranche5 },
		];
	}

	/**
	 * Calcule l'optimisation de rémunération
	 * 
	 * @param totalAmount - Montant total à rémunérer (en euros)
	 * @param currentProfit - Bénéfice actuel de l'entreprise (pour calculer l'IS)
	 * @param isPME - Est une PME (pour taux IS réduit)
	 * @returns Comparaison salaire vs dividendes avec recommandation
	 */
	async optimize(
		totalAmount: number,
		currentProfit: number = 0,
		isPME: boolean = true
	): Promise<CompensationOptimizationResult> {
		// Scénario 1 : Tout en salaire
		const salaryResult = this.calculateSalary(totalAmount);

		// Scénario 2 : Tout en dividendes
		const dividendsResult = this.calculateDividends(totalAmount, currentProfit, isPME);

		// Scénario 3 : Mixte (optimiser le ratio)
		const mixedResult = this.calculateMixed(totalAmount, currentProfit, isPME);

		// Déterminer la meilleure option
		const options = [
			{ type: 'SALARY' as const, cost: salaryResult.totalCost },
			{ type: 'DIVIDENDS' as const, cost: dividendsResult.totalCost },
			{ type: 'MIXED' as const, cost: mixedResult.totalCost },
		];

		const bestOption = options.reduce((best, current) =>
			current.cost < best.cost ? current : best
		);

		const worstCost = Math.max(...options.map((o) => o.cost));
		const savings = worstCost - bestOption.cost;

		let explanation = '';
		if (bestOption.type === 'SALARY') {
			explanation = 'La rémunération par salaire est plus avantageuse pour ce montant.';
		} else if (bestOption.type === 'DIVIDENDS') {
			explanation = 'La rémunération par dividendes est plus avantageuse (flat tax 30%).';
		} else {
			explanation = `Mixte recommandé : ${Math.round(mixedResult.salaryRatio * 100)}% salaire, ${Math.round((1 - mixedResult.salaryRatio) * 100)}% dividendes.`;
		}

		return {
			totalAmount,
			salary: salaryResult,
			dividends: dividendsResult,
			recommendation: {
				bestOption: bestOption.type,
				savings: Math.round(savings * 100) / 100,
				explanation,
			},
		};
	}

	/**
	 * Calcule le coût d'un salaire
	 * 
	 * @param grossSalary - Salaire brut
	 * @returns Détail du calcul salaire
	 * @private
	 */
	private calculateSalary(grossSalary: number) {
		const employeeContrib = grossSalary * this.SOCIAL_RATES.employee;
		const employerContrib = grossSalary * this.SOCIAL_RATES.employer;
		const netSalary = grossSalary - employeeContrib;
		const incomeTax = this.calculateIncomeTax(netSalary);
		const netAfterTax = netSalary - incomeTax;
		const totalCost = grossSalary + employerContrib; // Coût total employeur

		return {
			grossSalary: Math.round(grossSalary * 100) / 100,
			employeeContrib: Math.round(employeeContrib * 100) / 100,
			employerContrib: Math.round(employerContrib * 100) / 100,
			netSalary: Math.round(netSalary * 100) / 100,
			netAfterTax: Math.round(netAfterTax * 100) / 100,
			totalCost: Math.round(totalCost * 100) / 100,
		};
	}

	/**
	 * Calcule le coût des dividendes
	 * 
	 * @param grossDividends - Dividendes bruts
	 * @param currentProfit - Bénéfice actuel
	 * @param isPME - Est une PME
	 * @returns Détail du calcul dividendes
	 * @private
	 */
	private calculateDividends(grossDividends: number, currentProfit: number, isPME: boolean) {
		// IS sur les bénéfices (simplifié : on suppose que les dividendes viennent du bénéfice)
		// Pour simplifier, on prend un taux IS moyen de 28%
		const corporateTax = grossDividends * 0.28;

		// Flat tax 30% sur les dividendes nets d'IS
		const dividendsAfterIS = grossDividends - corporateTax;
		const flatTax = dividendsAfterIS * 0.30;
		const netDividends = dividendsAfterIS - flatTax;
		const totalCost = corporateTax + flatTax; // Coût total (IS + flat tax)

		return {
			grossDividends: Math.round(grossDividends * 100) / 100,
			corporateTax: Math.round(corporateTax * 100) / 100,
			flatTax: Math.round(flatTax * 100) / 100,
			netDividends: Math.round(netDividends * 100) / 100,
			totalCost: Math.round(totalCost * 100) / 100,
		};
	}

	/**
	 * Calcule le scénario mixte optimal
	 * 
	 * @param totalAmount - Montant total
	 * @param currentProfit - Bénéfice actuel
	 * @param isPME - Est une PME
	 * @returns Détail du calcul mixte
	 * @private
	 */
	private calculateMixed(totalAmount: number, currentProfit: number, isPME: boolean) {
		// Optimisation simple : tester différents ratios
		let bestRatio = 0.5;
		let bestCost = Infinity;

		// Tester des ratios de 0% à 100% par pas de 10%
		for (let ratio = 0; ratio <= 1; ratio += 0.1) {
			const salaryPart = totalAmount * ratio;
			const dividendsPart = totalAmount * (1 - ratio);

			const salary = this.calculateSalary(salaryPart);
			const dividends = this.calculateDividends(dividendsPart, currentProfit, isPME);

			const totalCost = salary.totalCost + dividends.totalCost;

			if (totalCost < bestCost) {
				bestCost = totalCost;
				bestRatio = ratio;
			}
		}

		const salaryPart = totalAmount * bestRatio;
		const dividendsPart = totalAmount * (1 - bestRatio);

		return {
			salaryRatio: bestRatio,
			salary: this.calculateSalary(salaryPart),
			dividends: this.calculateDividends(dividendsPart, currentProfit, isPME),
			totalCost: bestCost,
		};
	}

	/**
	 * Calcule l'impôt sur le revenu (barème progressif)
	 * 
	 * @param netIncome - Revenu net (après charges sociales)
	 * @returns Montant de l'impôt
	 * @private
	 */
	private calculateIncomeTax(netIncome: number): number {
		let tax = 0;
		let remaining = netIncome;

		for (const bracket of this.INCOME_TAX_BRACKETS) {
			if (remaining <= 0) break;

			const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
			tax += taxableInBracket * bracket.rate;
			remaining -= taxableInBracket;
		}

		return Math.round(tax * 100) / 100;
	}
}

