import { ApiClient } from './apiClient';
import type { Product, CreateProductData, UpdateProductData, ProductFilters, ProductListResponse } from '../types/product';
import type { ApiResponse } from '../types/api';

class ProductService {
  private apiClient = ApiClient.getInstance();

  async getProducts(filters?: ProductFilters, page = 1, limit = 10): Promise<ApiResponse<ProductListResponse>> {
    const params = new URLSearchParams();
    if (filters?.kind) params.append('kind', filters.kind);
    if (filters?.purpose) params.append('purpose', filters.purpose);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.minPrice !== undefined) params.append('minPrice', String(filters.minPrice));
    if (filters?.maxPrice !== undefined) params.append('maxPrice', String(filters.maxPrice));
    if (filters?.language) params.append('language', filters.language);
    if (filters?.minHours !== undefined) params.append('minHours', String(filters.minHours));
    if (filters?.maxHours !== undefined) params.append('maxHours', String(filters.maxHours));
    params.append('page', String(page));
    params.append('limit', String(limit));

    return this.apiClient.get<ProductListResponse>(`/products?${params.toString()}`);
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
}

export const productService = new ProductService();
