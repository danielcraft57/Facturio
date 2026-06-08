import type { TechStackAssembly } from './techStack';

export type ProductKind = 'SAAS' | 'APP' | 'SERVICE' | 'GOOD';
export type ProductPurpose =
  | 'WEBSITE'
  | 'SHOWCASE'
  | 'LANDING'
  | 'ECOMMERCE'
  | 'BLOG'
  | 'PORTAL'
  | 'INTRANET'
  | 'MARKETPLACE'
  | 'SAAS'
  | 'CONSULTING'
  | 'INTEGRATION'
  | 'AUTOMATION';

export type ProductCategory =
  | 'SETUP'
  | 'AUDIT'
  | 'CONSULTING'
  | 'THEME'
  | 'UX_UI'
  | 'DESIGN'
  | 'DEV'
  | 'API'
  | 'MOBILE'
  | 'INTEGRATION'
  | 'AUTOMATION'
  | 'ECOMMERCE'
  | 'PAYMENT'
  | 'CONTENT'
  | 'COPYWRITING'
  | 'SEO'
  | 'ANALYTICS'
  | 'HOSTING'
  | 'CI_CD'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'ACCESSIBILITY'
  | 'MAINTENANCE'
  | 'SUPPORT'
  | 'TRAINING'
  | 'MIGRATION'
  | 'DATA';

export type ProductVisualType = 'icon' | 'library' | 'custom';

/** Ligne de livrable — libellé seul ou avec montant/heures pour la répartition du prix. */
export type ProductDeliverable = {
  label: string;
  amount?: number | null;
  hours?: number | null;
};

/** Entrée catalogue livrable (autocomplete organisation). */
export type DeliverableCatalogItem = {
  id: number;
  label: string;
  defaultAmount: number | null;
  defaultHours: number | null;
};

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
  details?: ProductDeliverable[];
  visualType?: ProductVisualType;
  iconName?: string;
  imageData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  kind?: ProductKind;
  unitPrice?: number;
  defaultTaxRateId?: number;
  purpose?: ProductPurpose;
  category?: ProductCategory;
  languages?: string[];
  techStack?: TechStackAssembly;
  estimatedHours?: number;
  description?: string;
  details?: ProductDeliverable[];
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
  details?: ProductDeliverable[];
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
