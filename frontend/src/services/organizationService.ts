import { apiClient, type ApiResponse } from './api';

/**
 * Profil organisation (informations affichées sur devis et factures)
 */
export interface OrganizationProfile {
	id: number;
	name: string;
	legalName?: string | null;
	siret?: string | null;
	siren?: string | null;
	rcs?: string | null;
	rcsCity?: string | null;
	vatNumber?: string | null;
	address?: string | null;
	address2?: string | null;
	city?: string | null;
	zipCode?: string | null;
	country?: string | null;
	countryCode?: string | null;
	email?: string | null;
	phone?: string | null;
	website?: string | null;
	capital?: number | string | null;
	legalForm?: string | null;
	apeCode?: string | null;
	apeLabel?: string | null;
	legalRepresentative?: string | null;
	legalRepresentativeRole?: string | null;
	defaultCurrency?: string | null;
	defaultLanguage?: string | null;
	timezone?: string | null;
	logo?: string | null;
	signature?: string | null;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * Données de mise à jour du profil (champs optionnels)
 */
export type UpdateOrganizationProfile = Partial<Omit<OrganizationProfile, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Service d'accès au profil organisation (paramètres compte / infos devis-facture)
 */
export const organizationService = {
	/**
	 * Récupère le profil de l'organisation de l'utilisateur connecté
	 */
	async getProfile(): Promise<ApiResponse<OrganizationProfile>> {
		const res = await apiClient.get<OrganizationProfile>('/organization/profile');
		return res;
	},

	/**
	 * Met à jour le profil organisation
	 */
	async updateProfile(data: UpdateOrganizationProfile): Promise<ApiResponse<OrganizationProfile>> {
		const res = await apiClient.patch<OrganizationProfile>('/organization/profile', data);
		apiClient.invalidateCache('/organization');
		return res;
	},
};
