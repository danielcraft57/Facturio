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

class ProspectionServiceClass {
  private apiClient = ApiClient.getInstance();

  async getConfig(): Promise<ProspectionConfig> {
    const res = await this.apiClient.get<ProspectionConfig>('/prospection/config');
    if (!res.success || !res.data) {
      return { configured: false, tokensUrl: PROSPECTLAB_TOKENS_URL };
    }
    return res.data;
  }

  async updateConfig(payload: { apiUrl?: string; apiKey?: string }): Promise<ProspectionConfig> {
    const res = await this.apiClient.patch<ProspectionConfig>('/prospection/config', payload);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Erreur lors de la sauvegarde de la configuration ProspectLab');
    }
    return res.data;
  }

  async getProspects(page = 1, pageSize = 20, search?: string): Promise<ProspectionListResponse> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (search) params.set('search', search);
    const res = await this.apiClient.get<ProspectionListResponse>(`/prospection?${params.toString()}`);
    if (!res.success) {
      throw new Error(res.error || 'Erreur lors du chargement des prospects ProspectLab');
    }
    if (!res.data) {
      return { data: [], total: 0, page, pageSize, source: 'prospectlab' };
    }
    return res.data;
  }
}

export const prospectionService = new ProspectionServiceClass();
