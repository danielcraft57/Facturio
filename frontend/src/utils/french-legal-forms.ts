/** Formes juridiques courantes en France (RNE / INPI), libellés usuels. */
export const FRENCH_LEGAL_FORMS: readonly string[] = [
  'Artisan',
  'Association déclarée',
  'Association loi 1901',
  'Auto-entrepreneur',
  'Commerçant',
  'Coopérative',
  'EARL (Exploitation agricole à responsabilité limitée)',
  'Entreprise individuelle',
  'Entrepreneur individuel',
  'EIRL (Entrepreneur individuel à responsabilité limitée)',
  'EURL (Entreprise unipersonnelle à responsabilité limitée)',
  'Fondation',
  'GAEC (Groupement agricole d\'exploitation en commun)',
  'GEIE (Groupement européen d\'intérêt économique)',
  'GFA (Groupement foncier agricole)',
  'GIE (Groupement d\'intérêt économique)',
  'Holding',
  'Micro-entreprise',
  'Profession libérale',
  'SA (Société anonyme)',
  'SARL (Société à responsabilité limitée)',
  'SARL unipersonnelle',
  'SAS (Société par actions simplifiée)',
  'SASU (Société par actions simplifiée unipersonnelle)',
  'SCA (Société en commandite par actions)',
  'SCI (Société civile immobilière)',
  'SCIC (Société coopérative d\'intérêt collectif)',
  'SCM (Société civile de moyens)',
  'SCOP (Société coopérative et participative)',
  'SCP (Société civile professionnelle)',
  'SCS (Société en commandite simple)',
  'SELARL (Société d\'exercice libéral à responsabilité limitée)',
  'SELAFA (Société d\'exercice libéral à forme anonyme)',
  'SELAS (Société d\'exercice libéral par actions simplifiée)',
  'SELASU (Société d\'exercice libéral par actions simplifiée unipersonnelle)',
  'SNC (Société en nom collectif)',
  'Société civile',
  'Société civile foncière',
  'Société en participation',
  'Société étrangère immatriculée au RCS',
  'SPFPL (Société de participations financières de professions libérales)',
] as const

export function filterLegalForms(query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...FRENCH_LEGAL_FORMS]
  return FRENCH_LEGAL_FORMS.filter(
    (label) =>
      label.toLowerCase().includes(q) ||
      label
        .replace(/\s*\([^)]*\)/g, '')
        .toLowerCase()
        .includes(q),
  )
}
