import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encryptOrgStripeFields } from '../crypto/organization-stripe-secrets.util';
import { SecretsCryptoService } from '../crypto/secrets-crypto.service';
import { sanitizeOrganizationProfile } from './organization-profile.util';
import { UpdateInvoiceStripeDto } from './dto/update-invoice-stripe.dto';

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
	constructor(
		private readonly prisma: PrismaService,
		private readonly secretsCrypto: SecretsCryptoService,
	) {}

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

		return sanitizeOrganizationProfile(organization as Record<string, unknown>);
	}

	async updateInvoiceStripe(orgId: number, data: UpdateInvoiceStripeDto) {
		const update: Record<string, unknown> = {};
		if (data.invoiceStripePublishableKey !== undefined) {
			update.invoiceStripePublishableKey = data.invoiceStripePublishableKey || null;
		}
		Object.assign(
			update,
			encryptOrgStripeFields(this.secretsCrypto, {
				invoiceStripeSecretKey: data.invoiceStripeSecretKey,
				invoiceStripeWebhookSecret: data.invoiceStripeWebhookSecret,
			}),
		);
		if (
			(data.invoiceStripeSecretKey && data.invoiceStripeSecretKey.trim()) ||
			(data.invoiceStripePublishableKey && data.invoiceStripePublishableKey.trim())
		) {
			update.invoiceStripeConfiguredAt = new Date();
		}

		const organization = await this.prisma.organization.update({
			where: { id: orgId },
			data: update,
		});
		return sanitizeOrganizationProfile(organization as Record<string, unknown>);
	}

	getInvoiceStripeWebhookUrl(organizationId: number): string {
		const base =
			process.env.API_PUBLIC_URL?.trim() ||
			process.env.BACKEND_URL?.trim() ||
			'http://localhost:3000';
		return `${base.replace(/\/$/, '')}/api/webhooks/stripe/invoices/${organizationId}`;
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
		const organization = await this.prisma.organization.update({
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
				privacyPolicyUrl: data.privacyPolicyUrl,
				dataControllerEmail: data.dataControllerEmail,
			},
			include: {
				documents: {
					where: { status: 'VALIDATED' },
					orderBy: { createdAt: 'desc' },
				},
			},
		});
		return sanitizeOrganizationProfile(organization as Record<string, unknown>);
	}
}

