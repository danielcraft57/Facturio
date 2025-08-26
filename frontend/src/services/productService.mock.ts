import type { Product, CreateProductData, UpdateProductData, ProductFilters, ProductListResponse } from '../types/product';
import type { ApiResponse } from '../types/api';

const MOCK_PRODUCTS: Product[] = [
  // Exemples extraits des devis fournis
  { id: 5, name: 'Installation/Configuration Symfony 6', sku: 'SYMF6-INSTALL', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['php','symfony'], estimatedHours: 14, unitPrice: 1200, description: 'Installation du framework, config de base, environnements, dépendances, setup DB', details: ['Installation Symfony 6', 'Création base MySQL', 'Packages utiles', 'Intégration Webpack', 'Config env/dev/prod'], createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: 6, name: 'Entités, relations, migrations', sku: 'SYMF6-ENTITES', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['php','symfony','mysql'], estimatedHours: 14, unitPrice: 1400, description: 'Modélisation, création des entités, relations, migrations, validations', details: ['Modélisation du domaine', 'Entités + relations', 'Migrations versionnées', 'Règles de validation'], createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: 7, name: 'Intégration thème & personnalisation', sku: 'THEME-INTEG', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['html','css','js','webpack'], estimatedHours: 14, unitPrice: 1200, description: 'Intégration UI, palettes, logos, gabarits, optimisation responsive', details: ['Thème responsive', 'Custom logos/couleurs', 'Templates de pages', 'Optimisation mobile'], createdAt: '2024-01-16', updatedAt: '2024-01-16' },
  { id: 8, name: 'Développement fonctionnalités web', sku: 'WEB-FEATURES', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['ts','react','node'], estimatedHours: 70, unitPrice: 5000, description: 'Rubriques, formulaires, navigation, catalogue, espace utilisateur', details: ['Rubriques/sous-rubriques', 'Formulaires', 'Menus/navigation', 'Catalogue', 'Compte utilisateur'], createdAt: '2024-01-16', updatedAt: '2024-01-16' },
  { id: 9, name: 'CI/CD - Intégration & déploiement continus', sku: 'CI-CD', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['ci','cd'], estimatedHours: 14, unitPrice: 900, description: 'Pipelines build/test/deploy, environnements, secrets, rollbacks', details: ['Pipelines CI', 'Tests automatiques', 'Déploiement auto', 'Gestion des secrets', 'Rollback'], createdAt: '2024-01-17', updatedAt: '2024-01-17' },
  { id: 10, name: 'Hébergement, mise en prod & formation', sku: 'HOST-TRAIN', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['ops'], estimatedHours: 14, unitPrice: 1000, description: 'Setup hébergement, mise en prod, formation utilisateur/admin', details: ['Provisionnement', 'Mise en prod', 'Formation 1/2 journée'], createdAt: '2024-01-17', updatedAt: '2024-01-17' },

  { id: 11, name: 'API Symfony + API Platform', sku: 'API-SYMFONY', kind: 'SERVICE', purpose: 'SAAS', languages: ['php','symfony','api-platform'], estimatedHours: 84, unitPrice: 6000, description: 'Ressources CRUD, DTO, filtres, pagination, sécurité, tests', details: ['Ressources CRUD', 'DTO/normalizers', 'Filtres/pagination', 'Sécurité', 'Tests API'], createdAt: '2024-01-18', updatedAt: '2024-01-18' },
  { id: 12, name: 'Authentification API', sku: 'API-AUTH', kind: 'SERVICE', purpose: 'SAAS', languages: ['php','symfony','jwt'], estimatedHours: 14, unitPrice: 1200, description: 'JWT/OAuth, rôles, permissions, rafraîchissement, sécurisation endpoints', details: ['JWT/OAuth', 'Rôles/permissions', 'Refresh tokens', 'Hardening endpoints'], createdAt: '2024-01-18', updatedAt: '2024-01-18' },
  { id: 13, name: 'App mobile React Native - setup & UI', sku: 'RN-APP', kind: 'APP', purpose: 'SAAS', languages: ['ts','react-native'], estimatedHours: 210, unitPrice: 15000, description: 'Setup projet, navigation, écrans principaux, intégration API, tests', details: ['Bootstrapping', 'Navigation', 'Écrans clés', 'Intégration API', 'Tests'], createdAt: '2024-01-19', updatedAt: '2024-01-19' },
  { id: 14, name: 'Publication mobile & Firebase', sku: 'RN-PUBLISH', kind: 'SERVICE', purpose: 'SAAS', languages: ['firebase','ci'], estimatedHours: 56, unitPrice: 3500, description: 'CI mobile, build Android/iOS, Firebase hosting, publication stores', details: ['CI mobile', 'Builds AAB/IPA', 'Firebase hosting', 'Publication stores'], createdAt: '2024-01-19', updatedAt: '2024-01-19' },

  { id: 15, name: 'WordPress - Installation/Configuration', sku: 'WP-INSTALL', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['php','wordpress','mysql'], estimatedHours: 2, unitPrice: 200, description: 'Install WP, DB, configuration de base, plugins essentiels', details: ['Installation WP', 'Base de données', 'Plugins essentiels'], createdAt: '2024-01-20', updatedAt: '2024-01-20' },
  { id: 16, name: 'Personnalisation thème WordPress', sku: 'WP-THEME', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['php','wordpress'], estimatedHours: 14, unitPrice: 1200, description: 'Thème premium, customisation, templates pages, mobile responsive', details: ['Thème premium', 'Templates', 'Responsive/mobile'], createdAt: '2024-01-20', updatedAt: '2024-01-20' },
  { id: 17, name: 'Développement site WordPress', sku: 'WP-DEV', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['php','wordpress'], estimatedHours: 21, unitPrice: 1800, description: 'Pages, menus, formulaires, modules utiles, perf et accessibilité', details: ['Pages/menus', 'Formulaires', 'Modules utiles'], createdAt: '2024-01-21', updatedAt: '2024-01-21' },
  { id: 18, name: 'WooCommerce - module e-commerce', sku: 'WOO-ECOM', kind: 'SERVICE', purpose: 'ECOMMERCE', languages: ['php','wordpress','woocommerce'], estimatedHours: 17, unitPrice: 1500, description: 'WooCommerce + extensions, catalogues, frais de port, moyens de paiement', details: ['Installation WooCommerce', 'Extensions', 'Frais de port', 'Paiements'], createdAt: '2024-01-21', updatedAt: '2024-01-21' },
  { id: 19, name: 'Paiement CB sécurisé', sku: 'PAYMENT-CB', kind: 'SERVICE', purpose: 'ECOMMERCE', languages: ['php','gateway'], estimatedHours: 7, unitPrice: 600, description: 'Module de paiement CB, intégration, tests, passage en prod', details: ['Module CB', 'Intégration', 'Tests', 'Prod'], createdAt: '2024-01-22', updatedAt: '2024-01-22' },
  { id: 20, name: 'Contenus - reprise et création', sku: 'CONTENTS', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['content'], estimatedHours: 4, unitPrice: 300, description: 'Reprise contenus existants + création d’une base (10 produits/articles)', details: ['Reprise contenus', 'Création 10 items'], createdAt: '2024-01-22', updatedAt: '2024-01-22' },
  { id: 21, name: 'SEO de base (Yoast + balises)', sku: 'SEO-BASE', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['seo','wordpress'], estimatedHours: 7, unitPrice: 600, description: 'Yoast, balises principales, sitemap, réglages indexation', details: ['Yoast', 'Balises', 'Sitemap'], createdAt: '2024-01-23', updatedAt: '2024-01-23' },
  { id: 22, name: 'Livraison & Formation back-office', sku: 'WP-DELIVERY', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['wordpress'], estimatedHours: 4, unitPrice: 450, description: 'Mise en prod + formation back-office 1/2 journée', details: ['Mise en prod', 'Formation BO'], createdAt: '2024-01-23', updatedAt: '2024-01-23' },
  { id: 23, name: 'Maintenance WordPress START (12 mois)', sku: 'MWP-START', kind: 'SERVICE', purpose: 'WEBSITE', languages: ['wordpress'], unitPrice: 468, description: 'Mises à jour WP/plugins/thèmes, sécurité, vérifications régulières', createdAt: '2024-01-24', updatedAt: '2024-01-24' },
];

class MockProductService {
  private products = [...MOCK_PRODUCTS];

  private delay(ms = 300) { return new Promise(res => setTimeout(res, ms)); }

  private filter(list: Product[], f?: ProductFilters) {
    return list.filter(p => {
      if (f?.kind && p.kind !== f.kind) return false;
      if (f?.purpose && p.purpose !== f.purpose) return false;
      if (f?.search) {
        const q = f.search.toLowerCase();
        if (!(p.name.toLowerCase().includes(q) || (p.sku?.toLowerCase().includes(q)))) return false;
      }
      if (f?.minPrice !== undefined && (p.unitPrice ?? 0) < f.minPrice) return false;
      if (f?.maxPrice !== undefined && (p.unitPrice ?? 0) > f.maxPrice) return false;
      if (f?.language && !(p.languages || []).map(x => x.toLowerCase()).includes(f.language.toLowerCase())) return false;
      if (f?.minHours !== undefined && (p.estimatedHours ?? 0) < f.minHours) return false;
      if (f?.maxHours !== undefined && (p.estimatedHours ?? 0) > f.maxHours) return false;
      return true;
    });
  }

  async getProducts(filters?: ProductFilters, page = 1, limit = 10): Promise<ApiResponse<ProductListResponse>> {
    await this.delay();
    const list = this.filter(this.products, filters);
    const start = (page - 1) * limit;
    const data = list.slice(start, start + limit);
    return { success: true, data: { data, total: list.length, page, limit } };
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    await this.delay();
    const p = this.products.find(x => x.id === id);
    return p ? { success: true, data: p } : { success: false, error: 'Produit non trouvé' };
  }

  async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    await this.delay();
    const id = Math.max(...this.products.map(p => p.id)) + 1;
    const now = new Date().toISOString();
    const product: Product = { id, name: data.name, sku: data.sku, kind: data.kind ?? 'SERVICE', unitPrice: data.unitPrice, purpose: data.purpose, languages: data.languages, estimatedHours: data.estimatedHours, createdAt: now, updatedAt: now };
    this.products.unshift(product);
    return { success: true, data: product };
  }

  async updateProduct(id: number, data: UpdateProductData): Promise<ApiResponse<Product>> {
    await this.delay();
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, error: 'Produit non trouvé' };
    const updated: Product = { ...this.products[idx], ...data, updatedAt: new Date().toISOString() };
    this.products[idx] = updated;
    return { success: true, data: updated };
  }

  async deleteProduct(id: number): Promise<ApiResponse<boolean>> {
    await this.delay();
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, error: 'Produit non trouvé' };
    this.products.splice(idx, 1);
    return { success: true, data: true };
  }
}

export const mockProductService = new MockProductService();
