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

export interface Product {
  id: number;
  name: string;
  sku?: string;
  kind: ProductKind;
  unitPrice?: number;
  defaultTaxRateId?: number;
  purpose?: ProductPurpose; // but: site web, saas, ecommerce, vitrine
  category?: ProductCategory; // catégorie fonctionnelle (setup, theme, dev, ...)
  languages?: string[];     // langages/technos principales (ex: ts, react, nest)
  estimatedHours?: number;  // temps de conception estimé
  description?: string;     // détails du module/prestation
  details?: string[];       // points clés (bullet points)
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
  estimatedHours?: number;
  description?: string;
  details?: string[];
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
  estimatedHours?: number;
  description?: string;
  details?: string[];
}

export interface ProductFilters {
  kind?: ProductKind;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  purpose?: ProductPurpose;
  category?: ProductCategory;
  language?: string; // contient dans languages
  minHours?: number;
  maxHours?: number;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}
