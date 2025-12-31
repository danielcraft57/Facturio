import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service de gestion des crédits d'impôt
 * 
 * Gère :
 * - La détection automatique des crédits d'impôt éligibles (CIR, CII, Formation)
 * - Le calcul des montants de crédits d'impôt
 * - Le suivi des crédits d'impôt
 * 
 * @see TaxCreditsController pour les endpoints API
 */
@Injectable()
export class TaxCreditsService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Taux de crédits d'impôt (2024)
	 */
	private readonly CREDIT_RATES = {
		CIR: 0.30, // 30% des dépenses de R&D
		CII: 0.20, // 20% des dépenses d'innovation
		FORMATION: 0.60, // 60% des dépenses de formation
		APPRENTICESHIP: 0.11, // 11% des dépenses d'apprentissage
	};

	/**
	 * Calcule les crédits d'impôt éligibles pour une année
	 * 
	 * Détecte automatiquement les crédits d'impôt possibles :
	 * - CIR : si dépenses R&D détectées
	 * - CII : si dépenses d'innovation détectées
	 * - Formation : si dépenses de formation détectées
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param year - Année fiscale
	 * @param expenses - Dépenses par catégorie (optionnel, sinon calculé depuis les factures)
	 * @returns Liste des crédits d'impôt éligibles avec montants
	 */
	async calculateEligibleCredits(
		organizationId: number,
		year: number,
		expenses?: { rnd?: number; innovation?: number; formation?: number; apprenticeship?: number }
	) {
		// Si les dépenses ne sont pas fournies, on peut les calculer depuis les factures
		// Pour l'instant, on utilise les valeurs fournies
		const rndExpenses = expenses?.rnd || 0;
		const innovationExpenses = expenses?.innovation || 0;
		const formationExpenses = expenses?.formation || 0;
		const apprenticeshipExpenses = expenses?.apprenticeship || 0;

		const credits: Array<{
			type: string;
			name: string;
			eligibleAmount: number;
			rate: number;
			creditAmount: number;
			description: string;
		}> = [];

		// CIR (Crédit d'Impôt Recherche)
		if (rndExpenses > 0) {
			const creditAmount = rndExpenses * this.CREDIT_RATES.CIR;
			credits.push({
				type: 'CIR',
				name: 'Crédit d\'Impôt Recherche',
				eligibleAmount: rndExpenses,
				rate: this.CREDIT_RATES.CIR * 100,
				creditAmount: Math.round(creditAmount * 100) / 100,
				description: '30% des dépenses de recherche et développement',
			});
		}

		// CII (Crédit d'Impôt Innovation)
		if (innovationExpenses > 0) {
			const creditAmount = innovationExpenses * this.CREDIT_RATES.CII;
			credits.push({
				type: 'CII',
				name: 'Crédit d\'Impôt Innovation',
				eligibleAmount: innovationExpenses,
				rate: this.CREDIT_RATES.CII * 100,
				creditAmount: Math.round(creditAmount * 100) / 100,
				description: '20% des dépenses d\'innovation',
			});
		}

		// Formation
		if (formationExpenses > 0) {
			const creditAmount = formationExpenses * this.CREDIT_RATES.FORMATION;
			credits.push({
				type: 'FORMATION',
				name: 'Crédit d\'Impôt Formation',
				eligibleAmount: formationExpenses,
				rate: this.CREDIT_RATES.FORMATION * 100,
				creditAmount: Math.round(creditAmount * 100) / 100,
				description: '60% des dépenses de formation',
			});
		}

		// Apprentissage
		if (apprenticeshipExpenses > 0) {
			const creditAmount = apprenticeshipExpenses * this.CREDIT_RATES.APPRENTICESHIP;
			credits.push({
				type: 'APPRENTICESHIP',
				name: 'Crédit d\'Impôt Apprentissage',
				eligibleAmount: apprenticeshipExpenses,
				rate: this.CREDIT_RATES.APPRENTICESHIP * 100,
				creditAmount: Math.round(creditAmount * 100) / 100,
				description: '11% des dépenses d\'apprentissage',
			});
		}

		const totalCredit = credits.reduce((sum, c) => sum + c.creditAmount, 0);

		return {
			year,
			credits,
			totalCredit: Math.round(totalCredit * 100) / 100,
		};
	}

	/**
	 * Crée un crédit d'impôt
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param data - Données du crédit d'impôt
	 * @returns Crédit d'impôt créé
	 */
	async create(
		organizationId: number,
		data: {
			type: 'CIR' | 'CII' | 'FORMATION' | 'APPRENTICESHIP' | 'OTHER';
			name: string;
			description?: string;
			eligibleAmount: number;
			rate?: number;
			year: number;
			documents?: number[];
			notes?: string;
		}
	) {
		const creditRate = data.rate
			? data.rate / 100
			: (this.CREDIT_RATES[data.type as keyof typeof this.CREDIT_RATES] || 0.3);
		const creditAmount = data.eligibleAmount * creditRate;

		return this.prisma.taxCredit.create({
			data: {
				organizationId,
				type: data.type,
				name: data.name,
				description: data.description,
				eligibleAmount: data.eligibleAmount,
				rate: creditRate,
				creditAmount: Math.round(creditAmount * 100) / 100,
				year: data.year,
				status: 'ELIGIBLE',
				documents: data.documents ? (data.documents as any) : null,
				notes: data.notes,
			},
		});
	}

	/**
	 * Liste les crédits d'impôt
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param year - Année fiscale (optionnel)
	 * @returns Liste des crédits d'impôt
	 */
	async findAll(organizationId: number, year?: number) {
		const where: any = { organizationId };
		if (year) {
			where.year = year;
		}

		return this.prisma.taxCredit.findMany({
			where,
			orderBy: { year: 'desc' },
		});
	}

	/**
	 * Récupère un crédit d'impôt par ID
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param id - ID du crédit
	 * @returns Crédit d'impôt trouvé
	 */
	async findOne(organizationId: number, id: number) {
		const credit = await this.prisma.taxCredit.findFirst({
			where: { id, organizationId },
		});

		if (!credit) {
			throw new NotFoundException('Crédit d\'impôt non trouvé');
		}

		return credit;
	}

	/**
	 * Calcule le total des crédits d'impôt pour une année
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param year - Année fiscale
	 * @returns Total des crédits d'impôt
	 */
	async getTotalCredits(organizationId: number, year: number) {
		const credits = await this.prisma.taxCredit.findMany({
			where: {
				organizationId,
				year,
				status: { in: ['ELIGIBLE', 'CLAIMED', 'VALIDATED'] },
			},
		});

		const total = credits.reduce((sum, c) => sum + Number(c.creditAmount), 0);

		return {
			year,
			total: Math.round(total * 100) / 100,
			count: credits.length,
			byType: credits.reduce((acc, c) => {
				const type = c.type;
				const amount = Number(c.creditAmount);
				acc[type] = (acc[type] || 0) + amount;
				return acc;
			}, {} as Record<string, number>),
		};
	}

	/**
	 * Marque un crédit d'impôt comme réclamé
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param id - ID du crédit
	 * @returns Crédit d'impôt mis à jour
	 */
	async claim(organizationId: number, id: number) {
		await this.findOne(organizationId, id);
		return this.prisma.taxCredit.update({
			where: { id },
			data: { status: 'CLAIMED' },
		});
	}
}

