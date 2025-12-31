import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { FilingsService } from '../filings/filings.service';
import { ConfigService } from '../config/config.service';
import { CalculateContributionDto } from './dto/calculate-contribution.dto';
import { CreateUrssafFilingDto } from './dto/create-urssaf-filing.dto';
import { UpdateOrganizationUrssafDto, UrssafActivity } from './dto/update-organization-urssaf.dto';

/**
 * Résultat du calcul de cotisation URSSAF
 */
export interface ContributionCalculation {
	/** Chiffre d'affaires de la période (en euros) */
	ca: number;
	/** Taux de cotisation appliqué (ex: 0.22 pour 22%) */
	rate: number;
	/** Montant de la cotisation calculée (en euros) */
	contribution: number;
	/** Type d'activité (VENTE, SERVICE_BIC, SERVICE_BNC) */
	activity: UrssafActivity;
	/** Nombre de factures prises en compte */
	invoicesCount: number;
	/** Date de début de la période */
	periodStart: Date;
	/** Date de fin de la période */
	periodEnd: Date;
	/** Indique si le seuil annuel est dépassé */
	thresholdExceeded?: boolean;
	/** Seuil annuel applicable (en euros) */
	threshold?: number;
}

/**
 * Service de gestion des cotisations URSSAF pour auto-entrepreneurs et micro-entreprises
 * 
 * Ce service permet de :
 * - Calculer les cotisations URSSAF basées sur le CA
 * - Créer des déclarations URSSAF automatiques (mensuelles ou trimestrielles)
 * - Gérer la configuration URSSAF des organisations
 * - Vérifier les seuils de CA annuel
 * 
 * @see https://www.autoentrepreneur.urssaf.fr/ pour les taux officiels
 */
@Injectable()
export class UrssafService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly accounting: AccountingService,
		private readonly filings: FilingsService,
		private readonly config: ConfigService
	) {}

	// Taux par défaut selon activité (auto-entrepreneur) - depuis .env
	private get DEFAULT_RATES(): Record<UrssafActivity, number> {
		return {
			[UrssafActivity.VENTE]: this.config.urssafRateVente,
			[UrssafActivity.SERVICE_BIC]: this.config.urssafRateServiceBic,
			[UrssafActivity.SERVICE_BNC]: this.config.urssafRateServiceBnc,
		};
	}

	// Taux micro-fiscal (option micro-fiscal) - depuis .env
	private get FISCAL_RATES(): Record<UrssafActivity, number> {
		return {
			[UrssafActivity.VENTE]: this.config.urssafFiscalRateVente,
			[UrssafActivity.SERVICE_BIC]: this.config.urssafFiscalRateServiceBic,
			[UrssafActivity.SERVICE_BNC]: this.config.urssafFiscalRateServiceBnc,
		};
	}

	// Seuils de CA annuel - depuis .env
	private get ANNUAL_THRESHOLDS(): Record<UrssafActivity, number> {
		return {
			[UrssafActivity.VENTE]: this.config.urssafThresholdVente,
			[UrssafActivity.SERVICE_BIC]: this.config.urssafThresholdServiceBic,
			[UrssafActivity.SERVICE_BNC]: this.config.urssafThresholdServiceBnc,
		};
	}

	/**
	 * Calcule la cotisation URSSAF pour une période donnée
	 * 
	 * Le calcul se base sur :
	 * - Le CA des factures payées ou envoyées de la période
	 * - Le statut de l'organisation (auto-entrepreneur ou micro-entreprise)
	 * - L'activité déclarée (vente, services BIC, services BNC)
	 * - L'option micro-fiscal si activée
	 * - Un taux personnalisé si défini
	 * 
	 * @param dto - Paramètres de calcul (organisation, période)
	 * @returns Résultat du calcul avec CA, taux, cotisation, etc.
	 * @throws {NotFoundException} Si l'organisation n'existe pas
	 * @throws {BadRequestException} Si l'organisation n'est pas éligible (pas auto-entrepreneur/micro-entreprise)
	 * 
	 * @example
	 * ```typescript
	 * const result = await urssafService.calculateContribution({
	 *   organizationId: 1,
	 *   periodStart: '2024-01-01',
	 *   periodEnd: '2024-01-31'
	 * });
	 * // result.contribution = CA * taux
	 * ```
	 */
	async calculateContribution(dto: CalculateContributionDto): Promise<ContributionCalculation> {
		const organization = await this.prisma.organization.findUnique({
			where: { id: dto.organizationId },
		});

		if (!organization) {
			throw new NotFoundException('Organisation non trouvée');
		}

		// Vérifier que l'organisation est éligible (auto-entrepreneur ou micro-entreprise)
		if (
			organization.companyStatus !== 'AUTO_ENTREPRENEUR' &&
			organization.companyStatus !== 'MICRO_ENTERPRISE'
		) {
			throw new BadRequestException(
				'Le calcul URSSAF est uniquement disponible pour les auto-entrepreneurs et micro-entreprises'
			);
		}

		const periodStart = new Date(dto.periodStart);
		const periodEnd = new Date(dto.periodEnd);

		// Récupérer le CA de la période (factures payées ou envoyées)
		const invoices = await this.prisma.invoice.findMany({
			where: {
				organizationId: dto.organizationId,
				date: { gte: periodStart, lte: periodEnd },
				status: { in: ['PAID', 'SENT'] },
			},
		});

		const ca = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

		// Déterminer l'activité
		const activity =
			(organization.urssafActivity as UrssafActivity) || UrssafActivity.SERVICE_BIC;

		// Déterminer le taux
		let rate: number;
		if (organization.urssafFiscalOption) {
			// Option micro-fiscal
			rate = this.FISCAL_RATES[activity];
		} else if (organization.urssafRate) {
			// Taux personnalisé
			rate = Number(organization.urssafRate) / 100;
		} else {
			// Taux par défaut
			rate = this.DEFAULT_RATES[activity];
		}

		const contribution = ca * rate;

		// Vérifier le seuil annuel
		const threshold = organization.urssafThreshold
			? Number(organization.urssafThreshold)
			: this.ANNUAL_THRESHOLDS[activity];

		// Calculer le CA annuel (approximatif basé sur la période)
		const periodDays = Math.ceil(
			(periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
		);
		const annualCA = (ca / periodDays) * 365;
		const thresholdExceeded = annualCA > threshold;

		return {
			ca,
			rate,
			contribution,
			activity,
			invoicesCount: invoices.length,
			periodStart,
			periodEnd,
			thresholdExceeded,
			threshold,
		};
	}

	/**
	 * Crée une déclaration URSSAF automatique pour une période
	 * 
	 * Cette méthode :
	 * 1. Calcule la cotisation pour la période
	 * 2. Crée une déclaration (Filing) avec les détails
	 * 3. Génère l'écriture comptable correspondante
	 * 
	 * Formats de période acceptés :
	 * - Mensuel : "YYYY-MNN" (ex: "2024-M01", "2024-M12")
	 * - Trimestriel : "YYYY-QN" (ex: "2024-Q1", "2024-Q4")
	 * 
	 * @param dto - Paramètres de création (organisation, période)
	 * @returns La déclaration créée avec le calcul associé
	 * @throws {NotFoundException} Si l'organisation n'existe pas
	 * @throws {BadRequestException} Si le format de période est invalide
	 * 
	 * @example
	 * ```typescript
	 * const filing = await urssafService.createUrssafFiling({
	 *   organizationId: 1,
	 *   period: '2024-M01'
	 * });
	 * ```
	 */
	async createUrssafFiling(dto: CreateUrssafFilingDto) {
		const organization = await this.prisma.organization.findUnique({
			where: { id: dto.organizationId },
		});

		if (!organization) {
			throw new NotFoundException('Organisation non trouvée');
		}

		// Parser la période
		const periodMatch = dto.period.match(/^(\d{4})-(M|Q)(\d{1,2})$/);
		if (!periodMatch) {
			throw new BadRequestException(
				'Format de période invalide. Utilisez YYYY-MNN (ex: 2024-M01) ou YYYY-QN (ex: 2024-Q1)'
			);
		}

		const year = parseInt(periodMatch[1]);
		const type = periodMatch[2]; // M ou Q
		const num = parseInt(periodMatch[3]);

		let periodStart: Date;
		let periodEnd: Date;
		let filingType: 'URSSAF_MONTHLY' | 'URSSAF_QUARTERLY';

		if (type === 'M') {
			// Mensuel
			if (num < 1 || num > 12) {
				throw new BadRequestException('Mois invalide. Doit être entre 1 et 12.');
			}
			periodStart = new Date(year, num - 1, 1);
			periodEnd = new Date(year, num, 0); // Dernier jour du mois
			filingType = 'URSSAF_MONTHLY';
		} else {
			// Trimestriel
			if (num < 1 || num > 4) {
				throw new BadRequestException('Trimestre invalide. Doit être entre 1 et 4.');
			}
			const monthStart = (num - 1) * 3;
			periodStart = new Date(year, monthStart, 1);
			periodEnd = new Date(year, monthStart + 3, 0); // Dernier jour du trimestre
			filingType = 'URSSAF_QUARTERLY';
		}

		// Calculer la cotisation
		const calculation = await this.calculateContribution({
			organizationId: dto.organizationId,
			periodStart: periodStart.toISOString(),
			periodEnd: periodEnd.toISOString(),
			period: dto.period,
		});

		// Date d'échéance : fin du mois suivant la fin de la période
		const dueDate = new Date(periodEnd);
		dueDate.setMonth(dueDate.getMonth() + 1);
		dueDate.setDate(0); // Dernier jour du mois suivant

		// Créer la déclaration
		const filing = await this.filings.create({
			type: filingType,
			authority: 'URSSAF',
			periodStart: periodStart.toISOString(),
			periodEnd: periodEnd.toISOString(),
			dueDate: dueDate.toISOString(),
			notes: `Cotisation URSSAF ${dto.period} - ${calculation.activity}`,
		});

		// Ajouter les lignes de calcul
		await this.prisma.filingLine.create({
			data: {
				filingId: filing.id,
				taxRate: calculation.rate,
				taxableBase: calculation.ca,
				taxAmount: calculation.contribution,
			},
		});

		// Mettre à jour le montant dû
		await this.prisma.filing.update({
			where: { id: filing.id },
			data: { amountDue: calculation.contribution },
		});

		// Créer l'écriture comptable
		await this.accounting.postMicroSocialContribution({
			periodStart: periodStart.toISOString(),
			periodEnd: periodEnd.toISOString(),
			rate: calculation.rate,
			reference: `URSSAF-${dto.period}`,
			memo: `Cotisation URSSAF ${dto.period} - ${calculation.activity}`,
		});

		return {
			...filing,
			calculation,
		};
	}

	/**
	 * Récupère l'historique des cotisations URSSAF pour une organisation
	 * 
	 * Retourne toutes les déclarations URSSAF avec leurs détails :
	 * - Période et dates d'échéance
	 * - Montants dus et payés
	 * - Lignes de calcul (taux, base, montant)
	 * - Paiements effectués
	 * 
	 * @param organizationId - ID de l'organisation
	 * @returns Liste des déclarations URSSAF triées par date décroissante
	 * 
	 * @example
	 * ```typescript
	 * const history = await urssafService.getContributionsHistory(1);
	 * // history[0] = déclaration la plus récente
	 * ```
	 */
	async getContributionsHistory(organizationId: number) {
		const filings = await this.prisma.filing.findMany({
			where: {
				authority: 'URSSAF',
				lines: {
					some: {},
				},
			},
			include: {
				lines: true,
				payments: true,
			},
			orderBy: { periodStart: 'desc' },
		});

		// Filtrer par organisation (via les factures utilisées pour le calcul)
		// Note: Dans une vraie implémentation, on devrait lier Filing à Organization
		return filings.map((filing) => ({
			id: filing.id,
			type: filing.type,
			periodStart: filing.periodStart,
			periodEnd: filing.periodEnd,
			dueDate: filing.dueDate,
			status: filing.status,
			amountDue: Number(filing.amountDue),
			amountPaid: Number(filing.amountPaid),
			lines: filing.lines.map((line) => ({
				taxRate: Number(line.taxRate),
				taxableBase: Number(line.taxableBase),
				taxAmount: Number(line.taxAmount),
			})),
			payments: filing.payments.map((payment) => ({
				amount: Number(payment.amount),
				date: payment.date,
				reference: payment.reference,
			})),
		}));
	}

	/**
	 * Calcule le CA annuel estimé basé sur une période
	 * 
	 * Cette estimation permet de vérifier si l'organisation risque de dépasser
	 * les seuils annuels URSSAF. Le calcul est basé sur une projection linéaire
	 * du CA de la période sur une année complète.
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param periodStart - Date de début de la période
	 * @param periodEnd - Date de fin de la période
	 * @returns CA annuel estimé (en euros)
	 * 
	 * @example
	 * ```typescript
	 * const annualCA = await urssafService.estimateAnnualCA(
	 *   1,
	 *   new Date('2024-01-01'),
	 *   new Date('2024-01-31')
	 * );
	 * // Si CA mensuel = 10000€, annualCA ≈ 120000€
	 * ```
	 */
	async estimateAnnualCA(organizationId: number, periodStart: Date, periodEnd: Date): Promise<number> {
		const calculation = await this.calculateContribution({
			organizationId,
			periodStart: periodStart.toISOString(),
			periodEnd: periodEnd.toISOString(),
		});

		const periodDays = Math.ceil(
			(periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
		);
		return (calculation.ca / periodDays) * 365;
	}

	/**
	 * Met à jour la configuration URSSAF d'une organisation
	 * 
	 * Permet de modifier :
	 * - Le type d'activité (vente, services BIC, services BNC)
	 * - L'option micro-fiscal
	 * - La fréquence de déclaration (mensuelle ou trimestrielle)
	 * - Un taux personnalisé (en %)
	 * - Un seuil personnalisé (en €)
	 * 
	 * @param organizationId - ID de l'organisation
	 * @param dto - Données de mise à jour (tous les champs sont optionnels)
	 * @returns L'organisation mise à jour
	 * @throws {NotFoundException} Si l'organisation n'existe pas
	 * 
	 * @example
	 * ```typescript
	 * await urssafService.updateOrganizationUrssaf(1, {
	 *   urssafActivity: UrssafActivity.SERVICE_BIC,
	 *   urssafFiscalOption: true,
	 *   urssafDeclarationFrequency: 'QUARTERLY'
	 * });
	 * ```
	 */
	async updateOrganizationUrssaf(
		organizationId: number,
		dto: UpdateOrganizationUrssafDto
	) {
		const organization = await this.prisma.organization.findUnique({
			where: { id: organizationId },
		});

		if (!organization) {
			throw new NotFoundException('Organisation non trouvée');
		}

		const updateData: any = {};
		if (dto.urssafActivity !== undefined) updateData.urssafActivity = dto.urssafActivity;
		if (dto.urssafFiscalOption !== undefined)
			updateData.urssafFiscalOption = dto.urssafFiscalOption;
		if (dto.urssafDeclarationFrequency !== undefined)
			updateData.urssafDeclarationFrequency = dto.urssafDeclarationFrequency;
		if (dto.urssafRate !== undefined) updateData.urssafRate = dto.urssafRate;
		if (dto.urssafThreshold !== undefined) updateData.urssafThreshold = dto.urssafThreshold;

		return this.prisma.organization.update({
			where: { id: organizationId },
			data: updateData,
		});
	}
}

