import type { TechStackAssembly } from './techStack';

export type ProductKind = 'SAAS' | 'APP' | 'SERVICE' | 'GOOD';
export type ProductPurpose = 'WEBSITE' | 'SAAS' | 'ECOMMERCE' | 'SHOWCASE';
export type ProductCategory =
  | 'SETUP'
  | 'THEME'
  | 'DEV'
  | 'ECOMMERCE'
  | 'PAYMENT'
  | 'CONTENT'
  | 'SEO'
  | 'HOSTING'
  | 'CI_CD'
  | 'MAINTENANCE'
  | 'MOBILE'
  | 'API';

export type ProductVisualType = 'icon' | 'library' | 'custom';

export interface Product {
  id: number;
  name: string;
  sku?: string;
  kind: ProductKind;
  unitPrice?: number;
  defaultTaxRateId?: number;
  purpose?: ProductPurpose;
  category?: ProductCategory;
  languages?: string[];
  techStack?: TechStackAssembly;
  estimatedHours?: number;
  description?: string;
  details?: string[];
  visualType?: ProductVisualType;
  iconName?: string;
  imageData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  sku?: string;
  kind?: ProductKind;
  unitPrice?: number;
  defaultTaxRateId?: number;
  purpose?: ProductPurpose;
  category?: ProductCategory;
  languages?: string[];
  techStack?: TechStackAssembly;
  estimatedHours?: number;
  description?: string;
  details?: string[];
  visualType?: ProductVisualType;
  iconName?: string;
  imageData?: string;
}

export interface UpdateProductData {
  name?: string;
  sku?: string;
  kind?: ProductKind;
  unitPrice?: number;
  defaultTaxRateId?: number;
  purpose?: ProductPurpose;
  category?: ProductCategory;
  languages?: string[];
  techStack?: TechStackAssembly;
  estimatedHours?: number;
  description?: string;
  details?: string[];
  visualType?: ProductVisualType;
  iconName?: string;
  imageData?: string;
}

export interface ProductFilters {
  kind?: ProductKind;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  purpose?: ProductPurpose;
  category?: ProductCategory;
  language?: string;
  visualType?: ProductVisualType;
  minHours?: number;
  maxHours?: number;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}
