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
  // Nouveaux champs
  isTemplate?: boolean; // Si c'est un template prédéfini
  templateId?: string; // ID du template utilisé
  features?: string[]; // Fonctionnalités incluses
  deliveryTime?: number; // Délai de livraison en jours
}

export interface CreatePackData {
  name: string;
  type: PackType;
  description: string;
  details: string;
  products: string[];
  features?: string[];
  deliveryTime?: number;
}

export interface UpdatePackData {
  name?: string;
  type?: PackType;
  description?: string;
  details?: string;
  products?: string[];
  features?: string[];
  deliveryTime?: number;
}

export interface PackFilters {
  search?: string;
  type?: PackType;
  isTemplate?: boolean;
}

export interface PackListResponse {
  packs: Pack[];
  total: number;
  page: number;
  limit: number;
}

// Nouveaux types pour les templates
export interface PackTemplate {
  id: string;
  name: string;
  type: PackType;
  description: string;
  details: string;
  suggestedProducts: string[]; // IDs des produits suggérés
  features: string[];
  estimatedHours: number;
  estimatedPrice: number;
  deliveryTime: number;
  isPopular?: boolean;
  tags?: string[];
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
}
