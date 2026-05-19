/** Aligné sur https://danielcraft.fr/autres-prestations */

export type CatalogSectionId =
  | 'identity'
  | 'ai'
  | 'technical'
  | 'site'
  | 'maintenance'
  | 'offers';

export const CATALOG_SECTIONS: {
  id: CatalogSectionId;
  label: string;
  subtitle: string;
  skus: string[];
}[] = [
  {
    id: 'offers',
    label: 'Offres principales',
    subtitle: 'Sites, applications métier et packs.',
    skus: ['SITE-VITRINE', 'AUTO-METIER', 'AUDIT-OPTIM', 'PACK-SEO-GOOGLE-CHATGPT'],
  },
  {
    id: 'identity',
    label: 'Identité & visibilité',
    subtitle: 'Identité web multi-supports, SEO Google et ChatGPT.',
    skus: ['IDENTITE-MULTI', 'SEO-BASIQUE', 'SEO-CHATGPT'],
  },
  {
    id: 'ai',
    label: 'Intelligence artificielle & ChatGPT',
    subtitle: 'Assistants, automatisation et contenus IA.',
    skus: [
      'IA-FAQ-SITE',
      'IA-SUPPORT-EMAIL',
      'IA-CONTENUS-WEB',
      'IA-REDACTION-COMMERCIALE',
      'IA-ANALYSE-DONNEES',
      'IA-CHATBOT-ECOMMERCE',
      'IA-AUTOMATISATION-TACHES',
      'IA-MAINTENANCE-MENSUEL',
      'IA-EVOLUTION-FEATURE',
      'IA-AUDIT-USAGE',
    ],
  },
  {
    id: 'technical',
    label: 'Technique & intégration',
    subtitle: 'Architecture, CRM, migrations et API.',
    skus: ['CONSEIL-ARCHI', 'INTEG-CRM', 'MIGRATION-DONNEES', 'INTEG-API', 'RAPPORT-PERF'],
  },
  {
    id: 'site',
    label: 'Site & contenu',
    subtitle: 'Pages, formulaires et refontes légères.',
    skus: ['PAGE-SUPP', 'FORM-AVANCE', 'REFONTE-LEGERE', 'MAJ-CONTENU-5H', 'FORMATION-DEMI'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance & support',
    subtitle: 'Hébergement, sécurité et accompagnement.',
    skus: [
      'MAINT-MENSUEL',
      'HEBERG-DOMAIN',
      'BACKUP-SECU',
      'SSL-CONFIG',
      'SUPPORT-ABO',
      'DEPANNAGE-2H',
      'ACCOMP-H',
      'SUPPORT-H',
    ],
  },
];

const OTHER_SECTION = {
  id: 'offers' as CatalogSectionId,
  label: 'Autres prestations',
  subtitle: 'Produits personnalisés hors catalogue site.',
  skus: [] as string[],
};

export function groupProductsBySection<T extends { sku?: string }>(
  products: T[]
): { section: (typeof CATALOG_SECTIONS)[number]; products: T[] }[] {
  const usedSkus = new Set<string>();
  const grouped: { section: (typeof CATALOG_SECTIONS)[number]; products: T[] }[] = [];

  for (const section of CATALOG_SECTIONS) {
    const items = products.filter(p => {
      if (!p.sku || !section.skus.includes(p.sku)) return false;
      usedSkus.add(p.sku);
      return true;
    });
    if (items.length > 0) grouped.push({ section, products: items });
  }

  const unassigned = products.filter(p => p.sku && !usedSkus.has(p.sku));
  if (unassigned.length > 0) {
    grouped.push({ section: OTHER_SECTION, products: unassigned });
  }

  return grouped;
}
