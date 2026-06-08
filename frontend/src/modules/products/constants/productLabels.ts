import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faCloud,
  faMobileScreen,
  faWrench,
  faBox,
  faGlobe,
  faStore,
  faWindowMaximize,
  faScrewdriverWrench,
  faPalette,
  faCode,
  faCartShopping,
  faCreditCard,
  faPenNib,
  faMagnifyingGlass,
  faServer,
  faRocket,
  faScrewdriver,
  faPlug,
  faBullseye,
  faBlog,
  faSitemap,
  faNetworkWired,
  faShop,
  faComments,
  faRobot,
  faClipboardCheck,
  faGaugeHigh,
  faUniversalAccess,
  faChartLine,
  faShieldHalved,
  faHeadset,
  faChalkboardUser,
  faArrowsRotate,
  faDatabase,
  faBrush,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import type { ProductCategory, ProductKind, ProductPurpose } from '../../../types/product';

export const KIND_LABELS: Record<ProductKind, string> = {
  SAAS: 'SaaS',
  APP: 'Application',
  SERVICE: 'Service',
  GOOD: 'Produit physique',
};

export const KIND_ICONS: Record<ProductKind, IconDefinition> = {
  SAAS: faCloud,
  APP: faMobileScreen,
  SERVICE: faWrench,
  GOOD: faBox,
};

export const PRODUCT_KINDS: ProductKind[] = ['SAAS', 'APP', 'SERVICE', 'GOOD'];

export const PURPOSE_LABELS: Record<ProductPurpose, string> = {
  WEBSITE: 'Site web',
  SHOWCASE: 'Site vitrine',
  LANDING: 'Page d’atterrissage',
  ECOMMERCE: 'E-commerce',
  BLOG: 'Blog / média',
  PORTAL: 'Portail client',
  INTRANET: 'Intranet',
  MARKETPLACE: 'Marketplace',
  SAAS: 'Plateforme SaaS',
  CONSULTING: 'Conseil / audit',
  INTEGRATION: 'Intégration',
  AUTOMATION: 'Automatisation',
};

export const PURPOSE_ICONS: Record<ProductPurpose, IconDefinition> = {
  WEBSITE: faGlobe,
  SHOWCASE: faWindowMaximize,
  LANDING: faBullseye,
  ECOMMERCE: faStore,
  BLOG: faBlog,
  PORTAL: faSitemap,
  INTRANET: faNetworkWired,
  MARKETPLACE: faShop,
  SAAS: faCloud,
  CONSULTING: faComments,
  INTEGRATION: faPlug,
  AUTOMATION: faRobot,
};

export const PURPOSE_GROUPS: ReadonlyArray<{
  id: string;
  label: string;
  items: readonly ProductPurpose[];
}> = [
  {
    id: 'web',
    label: 'Sites & boutiques',
    items: ['WEBSITE', 'SHOWCASE', 'LANDING', 'ECOMMERCE', 'BLOG'],
  },
  {
    id: 'platform',
    label: 'Plateformes & espaces',
    items: ['SAAS', 'PORTAL', 'INTRANET', 'MARKETPLACE'],
  },
  {
    id: 'services',
    label: 'Prestations',
    items: ['CONSULTING', 'INTEGRATION', 'AUTOMATION'],
  },
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  SETUP: 'Installation',
  AUDIT: 'Audit & diagnostic',
  CONSULTING: 'Conseil',
  THEME: 'Thème & design',
  UX_UI: 'UX / UI',
  DESIGN: 'Design graphique',
  DEV: 'Développement',
  API: 'API',
  MOBILE: 'Mobile',
  INTEGRATION: 'Intégration',
  AUTOMATION: 'Automatisation',
  ECOMMERCE: 'E-commerce',
  PAYMENT: 'Paiement',
  CONTENT: 'Contenu',
  COPYWRITING: 'Rédaction',
  SEO: 'Référencement',
  ANALYTICS: 'Analytics',
  HOSTING: 'Hébergement',
  CI_CD: 'CI / CD',
  SECURITY: 'Sécurité',
  PERFORMANCE: 'Performance',
  ACCESSIBILITY: 'Accessibilité',
  MAINTENANCE: 'Maintenance',
  SUPPORT: 'Support & SAV',
  TRAINING: 'Formation',
  MIGRATION: 'Migration',
  DATA: 'Data / BI',
};

export const CATEGORY_ICONS: Record<ProductCategory, IconDefinition> = {
  SETUP: faScrewdriverWrench,
  AUDIT: faClipboardCheck,
  CONSULTING: faComments,
  THEME: faPalette,
  UX_UI: faBrush,
  DESIGN: faPalette,
  DEV: faCode,
  API: faPlug,
  MOBILE: faMobileScreen,
  INTEGRATION: faPlug,
  AUTOMATION: faRobot,
  ECOMMERCE: faCartShopping,
  PAYMENT: faCreditCard,
  CONTENT: faPenNib,
  COPYWRITING: faPen,
  SEO: faMagnifyingGlass,
  ANALYTICS: faChartLine,
  HOSTING: faServer,
  CI_CD: faRocket,
  SECURITY: faShieldHalved,
  PERFORMANCE: faGaugeHigh,
  ACCESSIBILITY: faUniversalAccess,
  MAINTENANCE: faScrewdriver,
  SUPPORT: faHeadset,
  TRAINING: faChalkboardUser,
  MIGRATION: faArrowsRotate,
  DATA: faDatabase,
};

export const CATEGORY_GROUPS: ReadonlyArray<{
  id: string;
  label: string;
  items: readonly ProductCategory[];
}> = [
  {
    id: 'project',
    label: 'Cadrage & projet',
    items: ['SETUP', 'AUDIT', 'CONSULTING', 'MIGRATION'],
  },
  {
    id: 'design',
    label: 'Design & contenu',
    items: ['THEME', 'UX_UI', 'DESIGN', 'CONTENT', 'COPYWRITING'],
  },
  {
    id: 'dev',
    label: 'Développement',
    items: ['DEV', 'API', 'MOBILE', 'ECOMMERCE', 'INTEGRATION', 'AUTOMATION'],
  },
  {
    id: 'growth',
    label: 'Visibilité & mesure',
    items: ['SEO', 'ANALYTICS', 'ACCESSIBILITY', 'PERFORMANCE'],
  },
  {
    id: 'ops',
    label: 'Infra & exploitation',
    items: ['HOSTING', 'CI_CD', 'SECURITY', 'PAYMENT', 'MAINTENANCE', 'SUPPORT', 'TRAINING', 'DATA'],
  },
];

export const FORM_STEPS = [
  { id: 'identity', label: 'Identité', icon: 'tag' },
  { id: 'classification', label: 'Classification', icon: 'layer-group' },
  { id: 'offer', label: 'Offre & tarif', icon: 'euro-sign' },
  { id: 'skills', label: 'Technos', icon: 'code' },
  { id: 'visual', label: 'Visuel', icon: 'image' },
  { id: 'summary', label: 'Récap', icon: 'check' },
] as const;

export type FormStepId = (typeof FORM_STEPS)[number]['id'];
