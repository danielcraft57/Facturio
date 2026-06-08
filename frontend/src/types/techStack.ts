export type TechAssemblyCategory =
  | 'languages'
  | 'frontend'
  | 'backend'
  | 'cms'
  | 'databases'
  | 'devops'
  | 'ai'
  | 'mobile'
  | 'security'

export type TechStackAssembly = Partial<Record<TechAssemblyCategory, string[]>>

export const TECH_ASSEMBLY_CATEGORY_LABELS: Record<TechAssemblyCategory, string> = {
  languages: 'Langages',
  frontend: 'Frontend',
  backend: 'Backend',
  cms: 'CMS',
  databases: 'BDD',
  devops: 'DevOps',
  ai: 'IA',
  mobile: 'Mobile',
  security: 'Sécu',
}

export const TECH_ASSEMBLY_CATEGORY_ORDER: TechAssemblyCategory[] = [
  'languages',
  'frontend',
  'backend',
  'cms',
  'databases',
  'devops',
  'ai',
  'mobile',
  'security',
]

export function flattenTechStack(assembly: TechStackAssembly | null | undefined): string[] {
  if (!assembly) return []
  const out: string[] = []
  for (const cat of TECH_ASSEMBLY_CATEGORY_ORDER) {
    for (const label of assembly[cat] ?? []) {
      if (!out.includes(label)) out.push(label)
    }
  }
  return out
}
