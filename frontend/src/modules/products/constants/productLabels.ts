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

export const PURPOSE_LABELS: Record<ProductPurpose, string> = {
  WEBSITE: 'Site web',
  SAAS: 'Plateforme SaaS',
  ECOMMERCE: 'E-commerce',
  SHOWCASE: 'Site vitrine',
};

export const PURPOSE_ICONS: Record<ProductPurpose, IconDefinition> = {
  WEBSITE: faGlobe,
  SAAS: faCloud,
  ECOMMERCE: faStore,
  SHOWCASE: faWindowMaximize,
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  SETUP: 'Installation',
  THEME: 'Thème & design',
  DEV: 'Développement',
  ECOMMERCE: 'E-commerce',
  PAYMENT: 'Paiement',
  CONTENT: 'Contenu',
  SEO: 'Référencement',
  HOSTING: 'Hébergement',
  CI_CD: 'CI / CD',
  MAINTENANCE: 'Maintenance',
  MOBILE: 'Mobile',
  API: 'API',
};

export const CATEGORY_ICONS: Record<ProductCategory, IconDefinition> = {
  SETUP: faScrewdriverWrench,
  THEME: faPalette,
  DEV: faCode,
  ECOMMERCE: faCartShopping,
  PAYMENT: faCreditCard,
  CONTENT: faPenNib,
  SEO: faMagnifyingGlass,
  HOSTING: faServer,
  CI_CD: faRocket,
  MAINTENANCE: faScrewdriver,
  MOBILE: faMobileScreen,
  API: faPlug,
};

export const FORM_STEPS = [
  { id: 'identity', label: 'Identité', icon: 'tag' },
  { id: 'classification', label: 'Classification', icon: 'layer-group' },
  { id: 'pricing', label: 'Tarif', icon: 'euro-sign' },
  { id: 'skills', label: 'Technos', icon: 'code' },
  { id: 'visual', label: 'Visuel', icon: 'image' },
  { id: 'content', label: 'Description', icon: 'align-left' },
  { id: 'summary', label: 'Récap', icon: 'check' },
] as const;

export type FormStepId = (typeof FORM_STEPS)[number]['id'];
