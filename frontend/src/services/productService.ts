import { ApiClient } from './apiClient';
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  ProductListResponse,
  DeliverableCatalogItem,
} from '../types/product';
import type { ApiResponse } from '../types/api';

const CATALOG_CACHE_TTL_MS = 2 * 60 * 1000;

function parseDeliverableCatalogResponse(
  res: ApiResponse<DeliverableCatalogItem[]> | DeliverableCatalogItem[],
): DeliverableCatalogItem[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

class ProductService {
  private apiClient = ApiClient.getInstance();

  private buildProductsUrl(filters?: ProductFilters, page = 1, limit = 10): string {
    const params = new URLSearchParams();
    if (filters?.kind) params.append('kind', filters.kind);
    if (filters?.purpose) params.append('purpose', filters.purpose);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.minPrice !== undefined) params.append('minPrice', String(filters.minPrice));
    if (filters?.maxPrice !== undefined) params.append('maxPrice', String(filters.maxPrice));
    if (filters?.language) params.append('language', filters.language);
    if (filters?.visualType) params.append('visualType', filters.visualType);
    if (filters?.minHours !== undefined) params.append('minHours', String(filters.minHours));
    if (filters?.maxHours !== undefined) params.append('maxHours', String(filters.maxHours));
    params.append('page', String(page));
    params.append('limit', String(limit));
    return `/products?${params.toString()}`;
  }

  peekCatalogCache(filters?: ProductFilters, page = 1, limit = 100) {
    return this.apiClient.peekCached<ProductListResponse>(
      this.buildProductsUrl(filters, page, limit),
    );
  }

  prefetchCatalog(limit = 100): Promise<ApiResponse<ProductListResponse>> {
    return this.apiClient.getCached<ProductListResponse>(
      this.buildProductsUrl(undefined, 1, limit),
      CATALOG_CACHE_TTL_MS,
    );
  }

  /** Vide le cache HTTP catalogue (après régénération onboarding). */
  invalidateCatalogCache(): void {
    this.apiClient.invalidateCache('/products');
  }

  async getProducts(filters?: ProductFilters, page = 1, limit = 10): Promise<ApiResponse<ProductListResponse>> {
    return this.apiClient.get<ProductListResponse>(this.buildProductsUrl(filters, page, limit));
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.apiClient.get<Product>(`/products/${id}`);
  }

  async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    return this.apiClient.post<Product>('/products', data);
  }

  async updateProduct(id: number, data: UpdateProductData): Promise<ApiResponse<Product>> {
    return this.apiClient.patch<Product>(`/products/${id}`, data);
  }

  async deleteProduct(id: number): Promise<ApiResponse<boolean>> {
    return this.apiClient.delete<boolean>(`/products/${id}`);
  }

  async searchDeliverableCatalog(q?: string): Promise<DeliverableCatalogItem[]> {
    const params = new URLSearchParams();
    if (q?.trim()) params.append('q', q.trim());
    const query = params.toString();
    const res = await this.apiClient.get<DeliverableCatalogItem[]>(
      `/products/deliverables/catalog${query ? `?${query}` : ''}`,
    );
    return parseDeliverableCatalogResponse(
      res as ApiResponse<DeliverableCatalogItem[]> | DeliverableCatalogItem[],
    );
  }
}

export const productService = new ProductService();
