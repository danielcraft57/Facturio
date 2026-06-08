import type { ProductCategory, ProductKind, ProductPurpose } from '../../../types/product';
import type { TechAssemblyCategory, TechStackAssembly } from '../../../types/techStack';
import { flattenTechStack } from '../../../types/techStack';

type Classification = {
  kind?: ProductKind;
  purpose?: ProductPurpose | '';
  category?: ProductCategory | '';
};

function addToStack(
  stack: TechStackAssembly,
  category: TechAssemblyCategory,
  labels: string[],
): void {
  const existing = stack[category] ?? [];
  const merged = [...existing];
  for (const label of labels) {
    const norm = label.trim().toLowerCase();
    if (!norm) continue;
    if (!merged.some((x) => x.toLowerCase() === norm)) merged.push(label);
  }
  if (merged.length) stack[category] = merged;
}

/** Proposition de stack selon type / but / catégorie (nouveau produit). */
export function suggestTechStackFromClassification({
  kind,
  purpose,
  category,
}: Classification): TechStackAssembly {
  const stack: TechStackAssembly = {};

  const webPurposes: (ProductPurpose | '')[] = [
    'WEBSITE',
    'SHOWCASE',
    'LANDING',
    'BLOG',
    'PORTAL',
    'INTRANET',
  ];

  if (purpose && webPurposes.includes(purpose)) {
    addToStack(stack, 'languages', ['HTML / CSS', 'JavaScript', 'PHP']);
    addToStack(stack, 'databases', ['MySQL / MariaDB']);
    addToStack(stack, 'devops', ['Nginx']);
    if (purpose !== 'BLOG') {
      addToStack(stack, 'cms', ['WordPress']);
    }
  }

  if (purpose === 'ECOMMERCE' || category === 'ECOMMERCE') {
    addToStack(stack, 'languages', ['PHP', 'JavaScript']);
    addToStack(stack, 'cms', ['PrestaShop', 'WordPress', 'Shopify']);
    addToStack(stack, 'databases', ['MySQL / MariaDB']);
    addToStack(stack, 'frontend', ['jQuery', 'Bootstrap']);
  }

  if (purpose === 'SAAS' || kind === 'SAAS' || kind === 'APP') {
    addToStack(stack, 'languages', ['TypeScript', 'JavaScript']);
    addToStack(stack, 'frontend', ['React']);
    addToStack(stack, 'backend', ['Node.js', 'NestJS']);
    addToStack(stack, 'databases', ['PostgreSQL']);
    addToStack(stack, 'devops', ['Docker', 'GitHub Actions']);
  }

  if (purpose === 'MARKETPLACE') {
    addToStack(stack, 'backend', ['Node.js', 'NestJS']);
    addToStack(stack, 'databases', ['PostgreSQL', 'Redis']);
  }

  if (purpose === 'INTEGRATION' || category === 'INTEGRATION' || category === 'API') {
    addToStack(stack, 'backend', ['Node.js', 'NestJS', 'FastAPI']);
    addToStack(stack, 'languages', ['TypeScript', 'Python', 'PHP']);
  }

  if (purpose === 'AUTOMATION' || category === 'AUTOMATION') {
    addToStack(stack, 'ai', ['n8n / Make']);
    addToStack(stack, 'languages', ['Python', 'JavaScript']);
  }

  if (category === 'MOBILE') {
    addToStack(stack, 'mobile', ['React Native', 'Flutter']);
  }

  if (category === 'THEME' || category === 'UX_UI' || category === 'DESIGN') {
    addToStack(stack, 'languages', ['HTML / CSS', 'JavaScript']);
    addToStack(stack, 'frontend', ['Sass / SCSS', 'Bootstrap']);
  }

  if (category === 'DEV') {
    addToStack(stack, 'languages', ['TypeScript', 'JavaScript']);
    addToStack(stack, 'frontend', ['React', 'Vue.js']);
    addToStack(stack, 'backend', ['Node.js', 'PHP', 'NestJS']);
  }

  if (category === 'HOSTING' || category === 'CI_CD') {
    addToStack(stack, 'devops', ['Docker', 'Nginx', 'GitHub Actions', 'AWS']);
  }

  if (category === 'SECURITY') {
    addToStack(stack, 'security', ['OWASP / bonnes pratiques']);
  }

  if (category === 'SEO' || category === 'CONTENT') {
    addToStack(stack, 'cms', ['WordPress']);
    addToStack(stack, 'languages', ['PHP', 'HTML / CSS']);
  }

  if (kind === 'GOOD') {
    return {};
  }

  return stack;
}

export function applySuggestedTechStackIfEmpty(
  current: TechStackAssembly,
  classification: Classification,
): TechStackAssembly {
  if (flattenTechStack(current).length > 0) return current;
  return suggestTechStackFromClassification(classification);
}
