/** Couches d'un produit développeur — aligné sur tech-stack-choices.json */
export type TechAssemblyCategory =
	| 'languages'
	| 'frontend'
	| 'backend'
	| 'cms'
	| 'databases'
	| 'devops'
	| 'ai'
	| 'mobile'
	| 'security';

export type TechStackAssembly = Partial<Record<TechAssemblyCategory, string[]>>;

export const TECH_ASSEMBLY_CATEGORY_LABELS: Record<TechAssemblyCategory, string> = {
	languages: 'Langages',
	frontend: 'Frontend',
	backend: 'Backend',
	cms: 'CMS',
	databases: 'BDD',
	devops: 'DevOps',
	ai: 'IA',
	mobile: 'Mobile',
	security: 'Sécurité',
};

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
];
