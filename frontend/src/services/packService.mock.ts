import type { Pack, CreatePackData, UpdatePackData, PackFilters, PackListResponse } from '../types/pack';
import { MOCK_PRODUCTS } from './productService.mock';

// Données de démo pour les packs
export const MOCK_PACKS: Pack[] = [
  {
    id: 'pack-1',
    name: 'Pack Site Vitrine Premium',
    type: 'WEBSITE',
    description: 'Solution complète pour créer un site vitrine professionnel',
    details: 'Inclut la conception graphique, le développement frontend, l\'intégration CMS, l\'optimisation SEO et la formation client. Design responsive et moderne avec animations fluides.',
    products: ['prod-1', 'prod-2', 'prod-3'],
    totalHours: 80,
    totalPrice: 12000,
    features: [
      'Design sur mesure',
      'Animations et transitions',
      'Blog intégré',
      'Espace client privé',
      'Analytics avancés',
      'Optimisation SEO complète'
    ],
    deliveryTime: 25,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'pack-2',
    name: 'Pack E-commerce Starter',
    type: 'ECOMMERCE',
    description: 'Boutique en ligne complète pour démarrer votre activité',
    details: 'Création d\'une boutique en ligne avec catalogue produits, panier d\'achat, système de paiement sécurisé, gestion des commandes et tableau de bord administrateur.',
    products: ['prod-4', 'prod-5', 'prod-6'],
    totalHours: 120,
    totalPrice: 18000,
    features: [
      'Catalogue produits illimité',
      'Panier d\'achat',
      'Paiement sécurisé',
      'Gestion des commandes',
      'Tableau de bord admin',
      'Emails automatiques'
    ],
    deliveryTime: 20,
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: 'pack-3',
    name: 'Pack SaaS Business',
    type: 'SAAS',
    description: 'Application SaaS complète avec gestion des utilisateurs',
    details: 'Développement d\'une application SaaS avec authentification, gestion des rôles, API REST, base de données, tableau de bord analytics et système de facturation.',
    products: ['prod-7', 'prod-8', 'prod-9'],
    totalHours: 200,
    totalPrice: 35000,
    features: [
      'Gestion des rôles et permissions',
      'Facturation intégrée',
      'Analytics et rapports',
      'Webhooks et API',
      'Multi-tenants',
      'Support technique 24/7'
    ],
    deliveryTime: 40,
    createdAt: '2024-02-01T09:15:00Z',
    updatedAt: '2024-02-01T09:15:00Z'
  },
  {
    id: 'pack-4',
    name: 'Pack Site Corporate',
    type: 'WEBSITE',
    description: 'Site institutionnel pour entreprise avec espace client',
    details: 'Site corporate avec pages institutionnelles, espace client privé, blog intégré, formulaire de contact et intégration CRM. Design professionnel et navigation intuitive.',
    products: ['prod-1', 'prod-3', 'prod-10'],
    totalHours: 100,
    totalPrice: 15000,
    features: [
      'Pages institutionnelles complètes',
      'Espace client privé',
      'Blog intégré',
      'Intégration CRM',
      'Support multi-langues',
      'Interface d\'administration'
    ],
    deliveryTime: 30,
    createdAt: '2024-02-10T16:45:00Z',
    updatedAt: '2024-02-10T16:45:00Z'
  }
];

export class MockPackService {
  async getPacks(filters?: PackFilters, page = 1, limit = 10): Promise<PackListResponse> {
    let filteredPacks = [...MOCK_PACKS];

    // Filtrage par recherche
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredPacks = filteredPacks.filter(pack =>
        pack.name.toLowerCase().includes(searchLower) ||
        pack.description.toLowerCase().includes(searchLower)
      );
    }

    // Filtrage par type
    if (filters?.type) {
      filteredPacks = filteredPacks.filter(pack => pack.type === filters.type);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPacks = filteredPacks.slice(startIndex, endIndex);

    return {
      packs: paginatedPacks,
      total: filteredPacks.length,
      page,
      limit
    };
  }

  async getPack(id: string): Promise<Pack | null> {
    const pack = MOCK_PACKS.find(p => p.id === id);
    return pack || null;
  }

  async createPack(data: CreatePackData): Promise<Pack> {
    // Calculer les totaux basés sur les produits sélectionnés
    const selectedProducts = MOCK_PRODUCTS.filter((p: any) => data.products.includes(p.id));
    const totalHours = selectedProducts.reduce((sum, p) => sum + (p.estimatedHours || 0), 0);
    const totalPrice = selectedProducts.reduce((sum, p) => sum + (p.unitPrice || 0), 0);

    const newPack: Pack = {
      id: `pack-${Date.now()}`,
      name: data.name,
      type: data.type,
      description: data.description,
      details: data.details,
      products: data.products,
      totalHours,
      totalPrice,
      features: data.features,
      deliveryTime: data.deliveryTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    MOCK_PACKS.push(newPack);
    return newPack;
  }

  async updatePack(id: string, data: UpdatePackData): Promise<Pack | null> {
    const packIndex = MOCK_PACKS.findIndex(p => p.id === id);
    if (packIndex === -1) return null;

    const existingPack = MOCK_PACKS[packIndex];
    
    // Recalculer les totaux si les produits ont changé
    let totalHours = existingPack.totalHours;
    let totalPrice = existingPack.totalPrice;
    
    if (data.products) {
      const selectedProducts = MOCK_PRODUCTS.filter((p: any) => data.products!.includes(p.id));
      totalHours = selectedProducts.reduce((sum, p) => sum + (p.estimatedHours || 0), 0);
      totalPrice = selectedProducts.reduce((sum, p) => sum + (p.unitPrice || 0), 0);
    }

    const updatedPack: Pack = {
      ...existingPack,
      ...data,
      products: data.products || existingPack.products,
      totalHours,
      totalPrice,
      updatedAt: new Date().toISOString()
    };

    MOCK_PACKS[packIndex] = updatedPack;
    return updatedPack;
  }

  async deletePack(id: string): Promise<boolean> {
    const packIndex = MOCK_PACKS.findIndex(p => p.id === id);
    if (packIndex === -1) return false;

    MOCK_PACKS.splice(packIndex, 1);
    return true;
  }
}

export const mockPackService = new MockPackService();
