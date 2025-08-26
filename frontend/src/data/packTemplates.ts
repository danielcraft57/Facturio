import type { PackTemplate } from '../types/pack';

export const PACK_TEMPLATES: PackTemplate[] = [
  // === SITES WEB ===
  {
    id: 'template-website-starter',
    name: 'Site Vitrine Starter',
    type: 'WEBSITE',
    description: 'Site vitrine simple et élégant pour présenter votre activité',
    details: 'Site vitrine responsive avec design moderne, pages essentielles (accueil, à propos, services, contact), formulaire de contact et optimisation SEO de base.',
    suggestedProducts: ['prod-1', 'prod-2'],
    features: [
      'Design responsive moderne',
      '5 pages personnalisées',
      'Formulaire de contact',
      'Optimisation SEO de base',
      'Intégration réseaux sociaux',
      'Hébergement 1 an inclus'
    ],
    estimatedHours: 40,
    estimatedPrice: 6000,
    deliveryTime: 15,
    isPopular: true,
    tags: ['starter', 'vitrine', 'responsive']
  },
  {
    id: 'template-website-premium',
    name: 'Site Vitrine Premium',
    type: 'WEBSITE',
    description: 'Site vitrine professionnel avec fonctionnalités avancées',
    details: 'Site vitrine haut de gamme avec design sur mesure, animations fluides, blog intégré, espace client, analytics avancés et optimisation SEO complète.',
    suggestedProducts: ['prod-1', 'prod-2', 'prod-3', 'prod-10'],
    features: [
      'Design sur mesure',
      'Animations et transitions',
      'Blog intégré',
      'Espace client privé',
      'Analytics avancés',
      'Optimisation SEO complète',
      'Maintenance 6 mois incluse'
    ],
    estimatedHours: 80,
    estimatedPrice: 12000,
    deliveryTime: 25,
    isPopular: true,
    tags: ['premium', 'sur-mesure', 'blog']
  },
  {
    id: 'template-website-corporate',
    name: 'Site Corporate',
    type: 'WEBSITE',
    description: 'Site institutionnel professionnel pour entreprises',
    details: 'Site corporate avec pages institutionnelles complètes, espace presse, carrières, intégration CRM, multi-langues et interface d\'administration.',
    suggestedProducts: ['prod-1', 'prod-3', 'prod-10'],
    features: [
      'Pages institutionnelles complètes',
      'Espace presse et médias',
      'Section carrières',
      'Intégration CRM',
      'Support multi-langues',
      'Interface d\'administration',
      'Formation équipe incluse'
    ],
    estimatedHours: 100,
    estimatedPrice: 15000,
    deliveryTime: 30,
    tags: ['corporate', 'institutionnel', 'multi-langues']
  },

  // === E-COMMERCE ===
  {
    id: 'template-ecommerce-starter',
    name: 'Boutique en Ligne Starter',
    type: 'ECOMMERCE',
    description: 'Boutique en ligne simple pour démarrer votre activité',
    details: 'Boutique en ligne avec catalogue produits, panier d\'achat, système de paiement sécurisé et gestion des commandes de base.',
    suggestedProducts: ['prod-4', 'prod-5'],
    features: [
      'Catalogue produits illimité',
      'Panier d\'achat',
      'Paiement sécurisé',
      'Gestion des commandes',
      'Tableau de bord admin',
      'Emails automatiques'
    ],
    estimatedHours: 80,
    estimatedPrice: 12000,
    deliveryTime: 20,
    isPopular: true,
    tags: ['starter', 'boutique', 'paiement']
  },
  {
    id: 'template-ecommerce-advanced',
    name: 'E-commerce Avancé',
    type: 'ECOMMERCE',
    description: 'Boutique en ligne complète avec fonctionnalités avancées',
    details: 'E-commerce professionnel avec gestion des stocks, multi-devises, système de fidélité, marketplace, analytics avancés et intégrations multiples.',
    suggestedProducts: ['prod-4', 'prod-5', 'prod-6', 'prod-11'],
    features: [
      'Gestion des stocks en temps réel',
      'Multi-devises',
      'Système de fidélité',
      'Marketplace',
      'Analytics avancés',
      'Intégrations multiples',
      'API complète'
    ],
    estimatedHours: 150,
    estimatedPrice: 25000,
    deliveryTime: 35,
    isPopular: true,
    tags: ['avancé', 'marketplace', 'multi-devises']
  },

  // === SAAS ===
  {
    id: 'template-saas-starter',
    name: 'SaaS Starter',
    type: 'SAAS',
    description: 'Application SaaS simple avec authentification',
    details: 'Application SaaS de base avec authentification utilisateurs, tableau de bord, gestion des profils et API REST simple.',
    suggestedProducts: ['prod-7', 'prod-8'],
    features: [
      'Authentification sécurisée',
      'Tableau de bord utilisateur',
      'Gestion des profils',
      'API REST',
      'Base de données',
      'Hébergement cloud'
    ],
    estimatedHours: 120,
    estimatedPrice: 20000,
    deliveryTime: 25,
    isPopular: true,
    tags: ['starter', 'saas', 'authentification']
  },
  {
    id: 'template-saas-business',
    name: 'SaaS Business',
    type: 'SAAS',
    description: 'Application SaaS complète pour entreprises',
    details: 'SaaS professionnel avec gestion des rôles, facturation intégrée, analytics, webhooks, multi-tenants et support technique.',
    suggestedProducts: ['prod-7', 'prod-8', 'prod-9', 'prod-12'],
    features: [
      'Gestion des rôles et permissions',
      'Facturation intégrée',
      'Analytics et rapports',
      'Webhooks et API',
      'Multi-tenants',
      'Support technique 24/7',
      'SLA garanti'
    ],
    estimatedHours: 200,
    estimatedPrice: 35000,
    deliveryTime: 40,
    isPopular: true,
    tags: ['business', 'multi-tenants', 'facturation']
  },
  {
    id: 'template-saas-enterprise',
    name: 'SaaS Enterprise',
    type: 'SAAS',
    description: 'Solution SaaS enterprise avec fonctionnalités avancées',
    details: 'SaaS de niveau enterprise avec SSO, audit trail, intégrations avancées, déploiement multi-régions et support dédié.',
    suggestedProducts: ['prod-7', 'prod-8', 'prod-9', 'prod-12', 'prod-13'],
    features: [
      'SSO et LDAP',
      'Audit trail complet',
      'Intégrations avancées',
      'Déploiement multi-régions',
      'Support dédié',
      'SLA 99.9%',
      'Formation sur site'
    ],
    estimatedHours: 300,
    estimatedPrice: 50000,
    deliveryTime: 60,
    tags: ['enterprise', 'sso', 'audit']
  }
];

// Fonction pour obtenir les templates par type
export const getTemplatesByType = (type: string) => {
  return PACK_TEMPLATES.filter(template => template.type === type);
};

// Fonction pour obtenir les templates populaires
export const getPopularTemplates = () => {
  return PACK_TEMPLATES.filter(template => template.isPopular);
};

// Fonction pour obtenir un template par ID
export const getTemplateById = (id: string) => {
  return PACK_TEMPLATES.find(template => template.id === id);
};
