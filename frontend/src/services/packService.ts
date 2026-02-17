import { ApiClient } from './apiClient';
import type { Pack, CreatePackData, UpdatePackData, PackFilters, PackListResponse } from '../types/pack';

export class PackService {
  private apiClient = ApiClient.getInstance();
  private baseUrl = '/packs';

  async getPacks(filters?: PackFilters, page = 1, limit = 10): Promise<PackListResponse> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(limit));
    if (filters?.search) params.set('search', filters.search);

    const res = await this.apiClient.get<PackListResponse>(`${this.baseUrl}?${params.toString()}`);
    const raw: any = (res as any)?.data ?? res;
    if (raw && Array.isArray(raw.packs)) {
      return {
        packs: raw.packs,
        total: raw.total ?? 0,
        page: raw.page ?? page,
        limit: raw.limit ?? limit
      };
    }
    if ((res as any)?.success === false) {
      throw new Error((res as any).error || 'Erreur lors de la récupération des packs');
    }
    return { packs: [], total: 0, page: 1, limit };
  }

  async getPack(id: string): Promise<Pack | null> {
    try {
      const response = await this.apiClient.get<Pack>(`${this.baseUrl}/${id}`);
      if (!response.success || !response.data) {
        return null;
      }
      return response.data;
    } catch (error: any) {
      if (error?.status === 404) return null;
      throw error;
    }
  }

  async createPack(data: CreatePackData): Promise<Pack> {
    const response = await this.apiClient.post<Pack>(this.baseUrl, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la création du pack');
    }
    return response.data;
  }

  async updatePack(id: string, data: UpdatePackData): Promise<Pack | null> {
    try {
      const response = await this.apiClient.patch<Pack>(`${this.baseUrl}/${id}`, data);
      if (!response.success || !response.data) {
        return null;
      }
      return response.data;
    } catch (error: any) {
      if (error?.status === 404) return null;
      throw error;
    }
  }

  async deletePack(id: string): Promise<boolean> {
    await this.apiClient.delete(`${this.baseUrl}/${id}`);
    return true;
  }
}

export const packService = new PackService();
