/** Profils onboarding — miroir de server/data/catalog/onboarding-profiles.json */

export type OnboardingProfileGroup = {
  id: string
  label: string
}

export type OnboardingProfileDef = {
  id: string
  legacyIds?: string[]
  groupId: string
  label: string
  description: string
  techCategories: string[]
  suggestedTechIds: string[]
}

export const ONBOARDING_PROFILE_GROUPS: OnboardingProfileGroup[] = [
  { id: 'dev', label: 'Développement & technique' },
  { id: 'design', label: 'Design & création web' },
  { id: 'commercial', label: 'Commercial & marketing' },
  { id: 'communication', label: 'Communication & contenu' },
  { id: 'consulting', label: 'Conseil, intégration & autre' },
]

export const ONBOARDING_PROFILES: OnboardingProfileDef[] = [
  {
    id: 'freelance-dev',
    legacyIds: ['freelance'],
    groupId: 'dev',
    label: 'Dev freelance / solo',
    description: 'Full-stack ou spécialisé, clients directs.',
    techCategories: ['languages', 'frontend', 'backend', 'cms', 'databases', 'devops', 'ai', 'mobile', 'cybersecurity'],
    suggestedTechIds: ['javascript', 'typescript'],
  },
  {
    id: 'student-dev',
    legacyIds: ['student'],
    groupId: 'dev',
    label: 'Étudiant·e / alternance dev',
    description: 'Premiers clients, stack classique à budget maîtrisé.',
    techCategories: ['languages', 'frontend', 'backend', 'cms', 'databases', 'devops', 'ai'],
    suggestedTechIds: ['html-css', 'javascript', 'php', 'wordpress'],
  },
  {
    id: 'studio-dev',
    legacyIds: ['studio'],
    groupId: 'dev',
    label: 'Petite agence / studio tech',
    description: 'Plusieurs stacks, livraisons en équipe.',
    techCategories: ['languages', 'frontend', 'backend', 'cms', 'databases', 'devops', 'ai', 'mobile'],
    suggestedTechIds: ['typescript', 'react', 'nodejs', 'wordpress'],
  },
  {
    id: 'indie',
    groupId: 'dev',
    label: 'Indie hacker / SaaS',
    description: 'Produit en ligne, automatisation, IA.',
    techCategories: ['languages', 'frontend', 'backend', 'databases', 'devops', 'ai', 'mobile'],
    suggestedTechIds: ['typescript', 'nextjs', 'nodejs', 'postgresql', 'vercel'],
  },
  {
    id: 'webdesigner',
    groupId: 'design',
    label: 'Webdesigner / intégrateur',
    description: 'Maquettes, intégration, sites vitrine.',
    techCategories: ['languages', 'frontend', 'cms', 'devops'],
    suggestedTechIds: ['html-css', 'wordpress', 'webflow', 'shopify'],
  },
  {
    id: 'ui-ux-designer',
    groupId: 'design',
    label: 'UI / UX designer',
    description: 'Parcours utilisateur, design systems, handoff dev.',
    techCategories: ['frontend', 'cms'],
    suggestedTechIds: ['webflow', 'wordpress', 'react'],
  },
  {
    id: 'no-code-maker',
    groupId: 'design',
    label: 'No-code / Webflow / Shopify',
    description: 'Sites et boutiques sans backend custom.',
    techCategories: ['cms', 'frontend', 'devops', 'ai'],
    suggestedTechIds: ['webflow', 'shopify', 'wordpress', 'n8n'],
  },
  {
    id: 'commercial',
    groupId: 'commercial',
    label: 'Commercial freelance',
    description: 'Prospection, devis, offres packagées.',
    techCategories: ['cms', 'frontend', 'ai'],
    suggestedTechIds: ['wordpress', 'chatgpt'],
  },
  {
    id: 'growth-marketing',
    groupId: 'commercial',
    label: 'Growth / marketing digital',
    description: 'Landing, SEO, analytics, campagnes.',
    techCategories: ['frontend', 'cms', 'devops', 'ai'],
    suggestedTechIds: ['nextjs', 'wordpress', 'vercel', 'n8n'],
  },
  {
    id: 'redacteur',
    groupId: 'communication',
    label: 'Rédacteur·rice / content',
    description: 'Articles, pages, contenus SEO, newsletters.',
    techCategories: ['cms', 'ai'],
    suggestedTechIds: ['wordpress', 'chatgpt', 'claude'],
  },
  {
    id: 'community-manager',
    groupId: 'communication',
    label: 'Community manager',
    description: 'Réseaux sociaux, modération, petits sites.',
    techCategories: ['cms', 'ai', 'frontend'],
    suggestedTechIds: ['wordpress', 'n8n', 'chatgpt'],
  },
  {
    id: 'consultant-digital',
    groupId: 'consulting',
    label: 'Consultant·e digital',
    description: 'Audit, accompagnement, cahier des charges.',
    techCategories: ['cms', 'frontend', 'backend', 'ai', 'devops'],
    suggestedTechIds: ['wordpress', 'javascript', 'n8n'],
  },
  {
    id: 'integrateur-cms',
    groupId: 'consulting',
    label: 'Intégrateur CMS / ERP léger',
    description: 'WordPress, PrestaShop, connecteurs.',
    techCategories: ['cms', 'languages', 'backend', 'databases', 'devops'],
    suggestedTechIds: ['wordpress', 'php', 'prestashop', 'mysql'],
  },
  {
    id: 'other',
    groupId: 'consulting',
    label: 'Autre profil',
    description: 'Stack complète — vous choisissez tout.',
    techCategories: [
      'languages',
      'frontend',
      'backend',
      'cms',
      'databases',
      'devops',
      'ai',
      'mobile',
      'cybersecurity',
    ],
    suggestedTechIds: [],
  },
]

export function normalizeOnboardingProfileId(profileId: string | null | undefined): string | null {
  if (!profileId) return null
  const direct = ONBOARDING_PROFILES.find((p) => p.id === profileId)
  if (direct) return direct.id
  const legacy = ONBOARDING_PROFILES.find((p) => p.legacyIds?.includes(profileId))
  return legacy?.id ?? profileId
}

export function resolveOnboardingProfile(profileId: string | null | undefined): OnboardingProfileDef | null {
  const normalized = normalizeOnboardingProfileId(profileId)
  if (!normalized) return null
  return ONBOARDING_PROFILES.find((p) => p.id === normalized) ?? null
}

/** Filtre les ids techno valides selon le catalogue chargé. */
export function filterSuggestedTechIds(
  profileId: string | null | undefined,
  validOptionIds: Set<string>,
): string[] {
  const profile = resolveOnboardingProfile(profileId)
  if (!profile?.suggestedTechIds.length) return []
  return profile.suggestedTechIds.filter((id) => validOptionIds.has(id))
}
