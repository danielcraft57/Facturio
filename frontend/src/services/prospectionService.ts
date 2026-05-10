import { ApiClient } from './apiClient';
import type { Prospect } from '../types/prospect';

export const PROSPECTLAB_TOKENS_URL = 'https://prospectlab.danielcraft.fr/tokens';

export interface ProspectionConfig {
  configured: boolean;
  hasToken?: boolean;
  apiUrl?: string;
  tokensUrl: string;
}

export interface ProspectionListResponse {
  data: Prospect[];
  total: number;
  page: number;
  pageSize: number;
  source: 'prospectlab';
}

/** Réponses Nest brutes ou enveloppe `{ success: boolean, data?: T }`. */
function unwrapApiBody<T>(raw: unknown): T {
	if (raw === null || raw === undefined) {
		throw new Error('Réponse vide');
	}
	if (typeof raw === 'object' && raw !== null && typeof (raw as { success?: boolean }).success === 'boolean') {
		const r = raw as { success: boolean; data?: T; error?: string; message?: string };
		if (r.success === false) {
			throw new Error(r.error || r.message || 'Erreur API');
		}
		if (r.data !== undefined) {
			return r.data;
		}
	}
	return raw as T;
}

class ProspectionServiceClass {
  private apiClient = ApiClient.getInstance();

  async getConfig(): Promise<ProspectionConfig> {
    const res = await this.apiClient.get<any>('/prospection/config');
    if (!res || res.success === false) {
      return { configured: false, tokensUrl: PROSPECTLAB_TOKENS_URL };
    }
    const body = unwrapApiBody<ProspectionConfig>(res);
    return {
      ...body,
      tokensUrl: body.tokensUrl || PROSPECTLAB_TOKENS_URL,
    };
  }

  async updateConfig(payload: { apiUrl?: string; apiKey?: string }): Promise<ProspectionConfig> {
    const res = await this.apiClient.patch<any>('/prospection/config', payload);
    if (!res || res.success === false) {
      throw new Error(res?.error || 'Erreur lors de la sauvegarde de la configuration ProspectLab');
    }
    const body = unwrapApiBody<ProspectionConfig>(res);
    return {
      ...body,
      tokensUrl: body.tokensUrl || PROSPECTLAB_TOKENS_URL,
    };
  }

  async getProspects(page = 1, pageSize = 20, search?: string): Promise<ProspectionListResponse> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (search) params.set('search', search);
    const res = await this.apiClient.get<any>(`/prospection?${params.toString()}`);
    if (!res || res.success === false) {
      throw new Error(res?.error || 'Erreur lors du chargement des prospects ProspectLab');
    }
    const body = unwrapApiBody<ProspectionListResponse>(res);
    if (!body?.data) {
      return { data: [], total: 0, page, pageSize, source: 'prospectlab' };
    }
    return body;
  }

  /** Contacts / emails enrichis (permissions « emails » sur le token ProspectLab si applicable). */
  async getEntrepriseEmails(entrepriseId: string): Promise<unknown> {
    const res = await this.apiClient.get<any>(
      `/prospection/entreprises/${encodeURIComponent(entrepriseId)}/emails`
    );
    if (!res || res.success === false) {
      throw new Error(res?.error || 'Impossible de charger les contacts ProspectLab');
    }
    return unwrapApiBody<unknown>(res);
  }
}

export const prospectionService = new ProspectionServiceClass();
