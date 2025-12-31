import { ApiClient } from './apiClient';
import type {
  Prospect,
  CreateProspectDto,
  UpdateProspectDto,
  ProspectFilters
} from '../types/prospect';

// Service principal
export class ProspectService {
  private apiClient = ApiClient.getInstance();
  private baseUrl = '/prospects';

  // Prospects
  async getProspects(filters?: ProspectFilters, page = 1, limit = 20): Promise<{ data: Prospect[]; total: number }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(limit));
    if (filters?.search) params.set('search', filters.search);
    
    const response = await this.apiClient.get<{ data: Prospect[]; total: number; page: number; pageSize: number }>(`${this.baseUrl}?${params.toString()}`);
    if (!response.success || !response.data) {
      return { data: [], total: 0 };
    }
    return {
      data: response.data.data || [],
      total: response.data.total || 0
    };
  }

  async createProspect(data: CreateProspectDto): Promise<Prospect> {
    const response = await this.apiClient.post<Prospect>(this.baseUrl, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la création du prospect');
    }
    return response.data;
  }

  async updateProspect(id: string, data: UpdateProspectDto): Promise<Prospect> {
    const response = await this.apiClient.patch<Prospect>(`${this.baseUrl}/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la mise à jour du prospect');
    }
    return response.data;
  }

  async deleteProspect(id: string): Promise<void> {
    await this.apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // Métriques et analytics
  async getProspectMetrics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byIndustry: Record<string, number>;
    conversionRate: number;
    averageScore: number;
  }> {
    const response = await this.apiClient.get<{
      total: number;
      byStatus: Record<string, number>;
      byIndustry: Record<string, number>;
      conversionRate: number;
      averageScore: number;
    }>(`${this.baseUrl}/metrics`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des métriques');
    }
    return response.data;
  }
}

export const prospectService = new ProspectService();
