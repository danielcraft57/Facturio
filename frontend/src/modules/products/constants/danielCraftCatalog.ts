/** Sections catalogue v2 + legacy v1 (prestations DanielCraft) */

import legacyMeta from './legacy-catalog-meta.json';

export type CatalogSectionId =
  | 'sites'
  | 'fullstack'
  | 'cms'
  | 'python'
  | 'mobile'
  | 'ai'
  | 'devops'
  | 'security'
  | 'addons';

export const CATALOG_SECTIONS: {
  id: CatalogSectionId;
  label: string;
  subtitle: string;
  skus: string[];
}[] = [
  {
    id: 'sites',
    label: 'Sites & vitrine',
    subtitle: 'HTML, WordPress, Next.js, Nuxt.',
    skus: [
      'STACK-WEB-STATIC',
      'STACK-WP-VITRINE',
      'STACK-NEXT-LANDING',
      'STACK-NUXT-SITE',
      'OFFRE-VITRINE-CLAIR',
      'OFFRE-CONSEIL-WEB',
      'OFFRE-REDACTION-WEB',
      'OFFRE-CHARTE-GRAPHIQUE',
      'OFFRE-HANDOVER',
      'OFFRE-BILAN-SITE',
      'OFFRE-FORMULE-SERENITE',
    ],
  },
  {
    id: 'fullstack',
    label: 'Full-stack & APIs',
    subtitle: 'React, NestJS, Supabase, GraphQL, Laravel.',
    skus: [
      'STACK-MVP-REACT-NEST',
      'STACK-NEXT-SUPABASE',
      'STACK-API-GRAPHQL-TS',
      'STACK-VUE-DASHBOARD',
      'STACK-LARAVEL-APP',
    ],
  },
  {
    id: 'cms',
    label: 'E-commerce & CMS',
    subtitle: 'PrestaShop, Shopify.',
    skus: ['STACK-PRESTASHOP-BOUTIQUE', 'STACK-SHOPIFY-THEME'],
  },
  {
    id: 'python',
    label: 'Python & data',
    subtitle: 'FastAPI, Django, RAG.',
    skus: ['STACK-FASTAPI-API', 'STACK-DJANGO-PORTAL', 'STACK-RAG-LANGCHAIN'],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    subtitle: 'React Native, Flutter.',
    skus: ['STACK-RN-APP', 'STACK-FLUTTER-APP'],
  },
  {
    id: 'ai',
    label: 'IA & automatisation',
    subtitle: 'Chatbots, n8n, Claude.',
    skus: ['STACK-CHATBOT-WEB', 'STACK-N8N-WORKFLOW', 'STACK-CLAUDE-INTEG'],
  },
  {
    id: 'devops',
    label: 'DevOps & infra',
    subtitle: 'Docker, K8s, AWS.',
    skus: ['STACK-DOCKER-CICD', 'STACK-K8S-DEPLOY', 'STACK-AWS-LIGHT'],
  },
  {
    id: 'security',
    label: 'Sécurité & audit',
    subtitle: 'OWASP, pentest.',
    skus: ['STACK-AUDIT-SECU', 'STACK-PENTEST-APP'],
  },
  {
    id: 'addons',
    label: 'Add-ons & récurrent',
    subtitle: 'SEO, pages, maintenance, support.',
    skus: [
      'STACK-MAINT-MENSUEL',
      'STACK-SUPPORT-ABO',
      'ADDON-SEO-BASIQUE',
      'ADDON-PAGE-SUPP',
      'ADDON-DEPANNAGE-2H',
      'ADDON-ACCOMP-H',
      'ADDON-FORMATION',
    ],
  },
];

/** Sections v1 (catalogue plat) — orgs créées avant la v2 stack. */
export const LEGACY_CATALOG_SECTIONS = legacyMeta.sections.map((section) => ({
  id: section.id as CatalogSectionId,
  label: section.label,
  subtitle: section.subtitle,
  skus: section.skus,
}));

export const ALL_CATALOG_SECTIONS = [...CATALOG_SECTIONS, ...LEGACY_CATALOG_SECTIONS];

const OTHER_SECTION = {
  id: 'sites' as CatalogSectionId,
  label: 'Autres produits',
  subtitle: 'Produits personnalisés hors catalogue.',
  skus: [] as string[],
};

export function groupProductsBySection<T extends { sku?: string }>(
  products: T[],
): { section: (typeof ALL_CATALOG_SECTIONS)[number]; products: T[] }[] {
  const usedIds = new Set<number | string>();
  const grouped: { section: (typeof ALL_CATALOG_SECTIONS)[number]; products: T[] }[] = [];

  const markUsed = (items: T[]) => {
    for (const p of items) {
      const key = (p as { id?: number }).id ?? (p as { sku?: string }).sku;
      if (key != null) usedIds.add(key);
    }
  };

  for (const section of ALL_CATALOG_SECTIONS) {
    const items = products.filter((p) => {
      if (!p.sku || !section.skus.includes(p.sku)) return false;
      const key = (p as { id?: number }).id ?? p.sku;
      return key != null && !usedIds.has(key);
    });
    if (items.length > 0) {
      markUsed(items);
      grouped.push({ section, products: items });
    }
  }

  const unassigned = products.filter((p) => {
    const key = (p as { id?: number }).id ?? p.sku;
    return key == null || !usedIds.has(key);
  });
  if (unassigned.length > 0) {
    grouped.push({ section: OTHER_SECTION, products: unassigned });
  }

  return grouped;
}
