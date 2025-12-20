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
    return {
      data: response.data || [],
      total: response.total || 0
    };
  }

  async createProspect(data: CreateProspectDto): Promise<Prospect> {
    const response = await this.apiClient.post<Prospect>(this.baseUrl, data);
    return response;
  }

  async updateProspect(id: string, data: UpdateProspectDto): Promise<Prospect> {
    const response = await this.apiClient.patch<Prospect>(`${this.baseUrl}/${id}`, data);
    return response;
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
    return response;
  }
}

export const prospectService = new ProspectService();
