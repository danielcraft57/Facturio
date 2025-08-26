import type { Pack, CreatePackData, UpdatePackData, PackFilters, PackListResponse } from '../types/pack';
import { mockPackService } from './packService.mock';

export class PackService {
  async getPacks(filters?: PackFilters, page = 1, limit = 10): Promise<PackListResponse> {
    return mockPackService.getPacks(filters, page, limit);
  }

  async getPack(id: string): Promise<Pack | null> {
    return mockPackService.getPack(id);
  }

  async createPack(data: CreatePackData): Promise<Pack> {
    return mockPackService.createPack(data);
  }

  async updatePack(id: string, data: UpdatePackData): Promise<Pack | null> {
    return mockPackService.updatePack(id, data);
  }

  async deletePack(id: string): Promise<boolean> {
    return mockPackService.deletePack(id);
  }
}

export const packService = new PackService();
