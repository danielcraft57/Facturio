import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service de gestion des organisations
 * 
 * Gère :
 * - Le profil organisation (récupération, mise à jour)
 * - Les informations légales (SIRET, SIREN, RCS, TVA, etc.)
 * - Les informations URSSAF (activité, taux, seuils)
 * - Les documents officiels validés
 * - Les paramètres (devise, langue, timezone)
 * 
 * @see OrganizationsController pour les endpoints API
 */
@Injectable()
export class OrganizationsService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Récupère le profil d'une organisation
	 * 
	 * Inclut les documents officiels validés.
	 * 
	 * @param orgId - ID de l'organisation
	 * @returns Organisation avec documents validés
	 * @throws {NotFoundException} Si organisation non trouvée
	 */
	async getProfile(orgId: number) {
		const organization = await this.prisma.organization.findUnique({
			where: { id: orgId },
			include: {
				documents: {
					where: { status: 'VALIDATED' },
					orderBy: { createdAt: 'desc' },
				},
			},
		});

		if (!organization) {
			throw new NotFoundException('Organisation introuvable');
		}

		return organization;
	}

	/**
	 * Met à jour le profil d'une organisation
	 * 
	 * Permet de mettre à jour toutes les informations :
	 * - Informations légales (nom, SIRET, SIREN, RCS, TVA)
	 * - Statut et type d'entreprise
	 * - Adresse et coordonnées
	 * - Informations URSSAF
	 * - Paramètres (devise, langue, timezone)
	 * 
	 * @param orgId - ID de l'organisation
	 * @param data - Données de mise à jour
	 * @returns Organisation mise à jour avec documents validés
	 */
	async updateProfile(orgId: number, data: any) {
		return this.prisma.organization.update({
			where: { id: orgId },
			data: {
				name: data.name,
				legalName: data.legalName,
				siret: data.siret,
				siren: data.siren,
				rcs: data.rcs,
				rcsCity: data.rcsCity,
				vatNumber: data.vatNumber,
				companyStatus: data.companyStatus,
				companyType: data.companyType,
				address: data.address,
				address2: data.address2,
				city: data.city,
				zipCode: data.zipCode,
				country: data.country,
				countryCode: data.countryCode,
				email: data.email,
				phone: data.phone,
				website: data.website,
				capital: data.capital,
				legalForm: data.legalForm,
				apeCode: data.apeCode,
				apeLabel: data.apeLabel,
				legalRepresentative: data.legalRepresentative,
				legalRepresentativeRole: data.legalRepresentativeRole,
				accountingYearEnd: data.accountingYearEnd,
				fiscalYear: data.fiscalYear,
				taxRegime: data.taxRegime,
				urssafRate: data.urssafRate,
				urssafActivity: data.urssafActivity,
				urssafFiscalOption: data.urssafFiscalOption,
				urssafDeclarationFrequency: data.urssafDeclarationFrequency,
				urssafThreshold: data.urssafThreshold,
				logo: data.logo,
				signature: data.signature,
				defaultCurrency: data.defaultCurrency,
				defaultLanguage: data.defaultLanguage,
				timezone: data.timezone,
			},
			include: {
				documents: {
					where: { status: 'VALIDATED' },
					orderBy: { createdAt: 'desc' },
				},
			},
		});
	}
}

