import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encryptOrgStripeFields } from '../crypto/organization-stripe-secrets.util';
import { SecretsCryptoService } from '../crypto/secrets-crypto.service';
import { sanitizeOrganizationProfile } from './organization-profile.util';
import { sanitizeOrganizationProfileUpdate } from './organization-profile.validation';
import { UpdateInvoiceStripeDto } from './dto/update-invoice-stripe.dto';
import {
	normalizeInvoiceStripePaymentMethods,
	serializeInvoiceStripePaymentMethods,
} from '../stripe/invoice-stripe-payment-methods';

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
		if (data.invoiceStripePaymentMethods !== undefined) {
			update.invoiceStripePaymentMethods = serializeInvoiceStripePaymentMethods(
				normalizeInvoiceStripePaymentMethods(data.invoiceStripePaymentMethods),
			);
		}
		Object.assign(
			update,
			encryptOrgStripeFields(this.secretsCrypto, {
				invoiceStripeSecretKey: data.invoiceStripeSecretKey,
				invoiceStripeWebhookSecret: data.invoiceStripeWebhookSecret,
				clearInvoiceStripeSecretKey: data.clearInvoiceStripeSecretKey,
				clearInvoiceStripeWebhookSecret: data.clearInvoiceStripeWebhookSecret,
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

	/** URL webhook unique (abonnement Facturio + paiements factures clients). */
	getInvoiceStripeWebhookUrl(_organizationId: number): string {
		const base =
			process.env.API_PUBLIC_URL?.trim() ||
			process.env.BACKEND_URL?.trim() ||
			'http://localhost:3000';
		return `${base.replace(/\/$/, '')}/api/webhooks/stripe`;
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
		const safe = sanitizeOrganizationProfileUpdate(data as Record<string, unknown>);
		const organization = await this.prisma.organization.update({
			where: { id: orgId },
			data: {
				name: safe.name,
				legalName: safe.legalName,
				siret: safe.siret,
				siren: safe.siren,
				rcs: safe.rcs,
				rcsCity: safe.rcsCity,
				vatNumber: safe.vatNumber,
				companyStatus: safe.companyStatus,
				companyType: safe.companyType,
				address: safe.address,
				address2: safe.address2,
				city: safe.city,
				zipCode: safe.zipCode,
				country: safe.country,
				countryCode: safe.countryCode,
				email: safe.email,
				phone: safe.phone,
				website: safe.website,
				capital: safe.capital,
				legalForm: safe.legalForm,
				apeCode: safe.apeCode,
				apeLabel: safe.apeLabel,
				legalRepresentative: safe.legalRepresentative,
				legalRepresentativeRole: safe.legalRepresentativeRole,
				accountingYearEnd: safe.accountingYearEnd,
				fiscalYear: safe.fiscalYear,
				taxRegime: safe.taxRegime,
				urssafRate: safe.urssafRate,
				urssafActivity: safe.urssafActivity,
				urssafFiscalOption: safe.urssafFiscalOption,
				urssafDeclarationFrequency: safe.urssafDeclarationFrequency,
				urssafThreshold: safe.urssafThreshold,
				logo: safe.logo,
				signature: safe.signature,
				defaultCurrency: safe.defaultCurrency,
				defaultLanguage: safe.defaultLanguage,
				timezone: safe.timezone,
				privacyPolicyUrl: safe.privacyPolicyUrl,
				dataControllerEmail: safe.dataControllerEmail,
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

