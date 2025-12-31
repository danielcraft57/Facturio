import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { CalculateIsDto } from './dto/calculate-is.dto';
import { CalculateCfeDto } from './dto/calculate-cfe.dto';

export interface CreateTaxDto {
	name: string;
	rate: number; // 0.2 pour 20%
	isDefault?: boolean;
}

export interface UpdateTaxDto {
	name?: string;
	rate?: number;
	isDefault?: boolean;
}

/**
 * Résultat du calcul de l'IS
 */
export interface IsCalculationResult {
	/** Résultat comptable (revenus - charges) */
	accountingResult: number;
	/** Résultat fiscal (après réintégrations et déductions) */
	fiscalResult: number;
	/** Bénéfice imposable */
	taxableIncome: number;
	/** IS calculé */
	corporateTax: number;
	/** Taux effectif d'imposition (%) */
	effectiveRate: number;
	/** Détail du calcul par tranche */
	calculationDetails: {
		tranche: string;
		base: number;
		rate: number;
		tax: number;
	}[];
	/** Réduction PME appliquée */
	pmeReduction?: number;
}

/**
 * Résultat du calcul de la CFE
 */
export interface CfeCalculationResult {
	/** Base de calcul (valeur locative ou forfait) */
	base: number;
	/** Taux appliqué (%) */
	rate: number;
	/** Montant de la CFE */
	amount: number;
	/** Exonération appliquée */
	exemption?: boolean;
	/** Raison de l'exonération */
	exemptionReason?: string;
}

/**
 * Service de gestion des taxes et impôts
 * 
 * Gère :
 * - Les taux de TVA (CRUD)
 * - Le calcul de l'Impôt sur les Sociétés (IS)
 * - Le calcul de la CFE (Cotisation Foncière des Entreprises)
 * - L'optimisation fiscale légale
 * 
 * @see TaxesController pour les endpoints API
 */
@Injectable()
export class TaxesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly config: ConfigService
	) {}

	create(data: CreateTaxDto) {
		// Validation
		if (!data.name) {
			throw new BadRequestException('Le nom est requis');
		}
		if (data.rate < 0 || data.rate > 1) {
			throw new BadRequestException('Le taux doit être entre 0 et 1 (0% à 100%)');
		}
		return this.prisma.taxRate.create({ data });
	}

	findAll(query?: { search?: string; isDefault?: boolean }) {
		const where = query?.search
			? { name: { contains: query.search } }
			: query?.isDefault !== undefined
			? { isDefault: query.isDefault }
			: undefined;

		return this.prisma.taxRate.findMany({ 
			where,
			orderBy: { createdAt: 'desc' } 
		});
	}

	async findOne(id: number) {
		const tax = await this.prisma.taxRate.findUnique({ where: { id } });
		if (!tax) throw new NotFoundException('Taux non trouve');
		return tax;
	}

	async update(id: number, data: UpdateTaxDto) {
		await this.findOne(id);
		return this.prisma.taxRate.update({ where: { id }, data });
	}

	async remove(id: number) {
		await this.findOne(id);
		await this.prisma.taxRate.delete({ where: { id } });
		return { success: true };
	}

	/**
	 * Calcule l'Impôt sur les Sociétés (IS)
	 * 
	 * Applique les taux progressifs selon le bénéfice :
	 * - Bénéfice ≤ 38 120€ : 15%
	 * - 38 120€ < Bénéfice ≤ 75 000€ : 15% sur 38 120€, puis 28% sur le reste
	 * - Bénéfice > 75 000€ : 15% sur 38 120€, 28% sur 36 880€, puis 31% sur le reste
	 * 
	 * Réduction PME de 25% si :
	 * - CA < 10M€
	 * - Capital détenu à 75% minimum par des personnes physiques
	 * - Bénéfice ≤ 38 120€
	 * 
	 * @param dto - Paramètres de calcul (année, revenus, charges, etc.)
	 * @returns Résultat du calcul avec détail par tranche
	 * 
	 * @example
	 * ```typescript
	 * const result = await taxesService.calculateIS({
	 *   year: 2024,
	 *   revenue: 100000,
	 *   expenses: 60000,
	 *   isPME: true,
	 *   capitalHeldByIndividuals: 80
	 * });
	 * // result.corporateTax = montant de l'IS
	 * // result.effectiveRate = taux effectif
	 * ```
	 */
	async calculateIS(dto: CalculateIsDto): Promise<IsCalculationResult> {
		// Calcul du résultat comptable
		const accountingResult = dto.revenue - dto.expenses;

		// Calcul du résultat fiscal
		const fiscalResult =
			accountingResult +
			(dto.fiscalReintegrations || 0) -
			(dto.fiscalDeductions || 0) -
			(dto.amortizations || 0) -
			(dto.provisions || 0) -
			(dto.lossCarryForward || 0);

		// Le bénéfice imposable ne peut pas être négatif
		const taxableIncome = Math.max(0, fiscalResult);

		// Calcul de l'IS selon les tranches (taux 2024)
		const calculationDetails: { tranche: string; base: number; rate: number; tax: number }[] = [];
		let corporateTax = 0;

		if (taxableIncome <= 0) {
			// Pas d'IS si bénéfice négatif ou nul
			return {
				accountingResult,
				fiscalResult,
				taxableIncome: 0,
				corporateTax: 0,
				effectiveRate: 0,
				calculationDetails: [],
			};
		}

		// Tranche 1 : 0 à seuil tranche 1
		const threshold1 = this.config.isThresholdTranche1;
		const rate1 = this.config.isRateTranche1;
		if (taxableIncome > 0) {
			const base1 = Math.min(taxableIncome, threshold1);
			const tax1 = base1 * rate1;
			calculationDetails.push({
				tranche: `0 - ${threshold1.toLocaleString('fr-FR')}€`,
				base: base1,
				rate: rate1 * 100,
				tax: tax1,
			});
			corporateTax += tax1;
		}

		// Tranche 2 : seuil tranche 1 à seuil tranche 2
		const threshold2 = this.config.isThresholdTranche2;
		const rate2 = this.config.isRateTranche2;
		if (taxableIncome > threshold1) {
			const base2 = Math.min(taxableIncome - threshold1, threshold2 - threshold1);
			const tax2 = base2 * rate2;
			calculationDetails.push({
				tranche: `${threshold1.toLocaleString('fr-FR')}€ - ${threshold2.toLocaleString('fr-FR')}€`,
				base: base2,
				rate: rate2 * 100,
				tax: tax2,
			});
			corporateTax += tax2;
		}

		// Tranche 3 : > seuil tranche 2
		const rate3 = this.config.isRateTranche3;
		if (taxableIncome > threshold2) {
			const base3 = taxableIncome - threshold2;
			const tax3 = base3 * rate3;
			calculationDetails.push({
				tranche: `> ${threshold2.toLocaleString('fr-FR')}€`,
				base: base3,
				rate: rate3 * 100,
				tax: tax3,
			});
			corporateTax += tax3;
		}

		// Réduction PME de 25% si éligible
		let pmeReduction = 0;
		if (
			dto.isPME &&
			dto.capitalHeldByIndividuals &&
			dto.capitalHeldByIndividuals >= 75 &&
			taxableIncome <= 38120
		) {
			// Réduction de 25% sur l'IS, plafonnée à 38 120€ de bénéfice
			pmeReduction = corporateTax * 0.25;
			corporateTax -= pmeReduction;
		}

		// Arrondir à 2 décimales
		corporateTax = Math.round(corporateTax * 100) / 100;
		const effectiveRate = taxableIncome > 0 ? (corporateTax / taxableIncome) * 100 : 0;

		return {
			accountingResult,
			fiscalResult,
			taxableIncome,
			corporateTax,
			effectiveRate: Math.round(effectiveRate * 100) / 100,
			calculationDetails,
			pmeReduction: pmeReduction > 0 ? Math.round(pmeReduction * 100) / 100 : undefined,
		};
	}

	/**
	 * Calcule la CFE (Cotisation Foncière des Entreprises)
	 * 
	 * La CFE est calculée sur la valeur locative des biens immobiliers,
	 * ou sur un forfait selon l'activité et le CA.
	 * 
	 * Exonération possible la première année d'activité.
	 * 
	 * @param dto - Paramètres de calcul (année, valeur locative, activité, etc.)
	 * @returns Résultat du calcul de la CFE
	 * 
	 * @example
	 * ```typescript
	 * const result = await taxesService.calculateCFE({
	 *   year: 2024,
	 *   propertyValue: 50000,
	 *   activity: 'SERVICE',
	 *   isFirstYear: false
	 * });
	 * // result.amount = montant de la CFE
	 * ```
	 */
	async calculateCFE(dto: CalculateCfeDto): Promise<CfeCalculationResult> {
		// Exonération première année
		if (dto.isFirstYear) {
			return {
				base: 0,
				rate: 0,
				amount: 0,
				exemption: true,
				exemptionReason: 'Exonération première année d\'activité',
			};
		}

		// Calcul de la base
		let base = 0;

		if (dto.propertyValue && dto.propertyValue > 0) {
			// Utiliser la valeur locative si fournie
			base = dto.propertyValue;
		} else if (dto.revenue && dto.activity) {
			// Forfait selon l'activité et le CA
			// Coefficients approximatifs (à ajuster selon les règles réelles)
			const coefficients: Record<string, number> = {
				SERVICE: 0.1, // 10% du CA
				COMMERCE: 0.15, // 15% du CA
				INDUSTRIE: 0.2, // 20% du CA
				ARTISANAT: 0.12, // 12% du CA
			};
			const coefficient = coefficients[dto.activity] || 0.1;
			base = dto.revenue * coefficient;
		} else {
			throw new BadRequestException(
				'Valeur locative ou (activité + CA) requis pour calculer la CFE'
			);
		}

		// Taux communal (minimum 0,5%, variable selon la commune)
		// Par défaut, utiliser 1% si non fourni
		const rate = dto.communalRate ? dto.communalRate / 100 : 0.01;

		// Calcul de la CFE
		const amount = base * rate;

		return {
			base: Math.round(base * 100) / 100,
			rate: rate * 100,
			amount: Math.round(amount * 100) / 100,
		};
	}
}


