export type PackType = 'WEBSITE' | 'ECOMMERCE' | 'SAAS';

export interface Pack {
  id: string;
  name: string;
  type: PackType;
  description: string;
  details: string;
  products: string[]; // IDs des produits inclus
  totalHours: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackData {
  name: string;
  type: PackType;
  description: string;
  details: string;
  products: string[];
}

export interface UpdatePackData {
  name?: string;
  type?: PackType;
  description?: string;
  details?: string;
  products?: string[];
}

export interface PackFilters {
  search?: string;
  type?: PackType;
}

export interface PackListResponse {
  packs: Pack[];
  total: number;
  page: number;
  limit: number;
}
