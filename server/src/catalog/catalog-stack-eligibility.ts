import type { TechStackAssembly } from './tech-assembly.types';

/** Libellés produit → id d'option tech-stack (sélection explicite requise). */
const CMS_LABEL_TO_OPTION: Record<string, string> = {
	WordPress: 'wordpress',
	PrestaShop: 'prestashop',
	Shopify: 'shopify',
	Strapi: 'strapi',
	Drupal: 'drupal',
	Webflow: 'webflow',
};

const FRAMEWORK_LABEL_TO_OPTION: Record<string, string> = {
	Laravel: 'laravel',
	Symfony: 'symfony',
	NestJS: 'nestjs',
	FastAPI: 'fastapi',
	Django: 'django',
	Rails: 'rails',
	'Ruby on Rails': 'rails',
	Spring: 'spring',
	'ASP.NET': 'aspnet',
	Express: 'express',
	CodeIgniter: 'codeigniter',
	CakePHP: 'cakephp',
};

const MOBILE_LABEL_TO_OPTION: Record<string, string> = {
	'React Native': 'react-native',
	Flutter: 'flutter',
	iOS: 'swift',
	Android: 'kotlin',
};

const AI_LABEL_TO_OPTION: Record<string, string> = {
	OpenAI: 'chatgpt',
	ChatGPT: 'chatgpt',
	Claude: 'claude',
	Anthropic: 'claude',
	LangChain: 'langchain',
	n8n: 'n8n',
	Make: 'n8n',
};

const DEVOPS_LABEL_TO_OPTION: Record<string, string> = {
	Docker: 'docker',
	Kubernetes: 'kubernetes',
	AWS: 'aws',
	'GitHub Actions': 'github-actions',
	Vercel: 'vercel',
	Nginx: 'nginx',
	Netlify: 'netlify',
	'CI/CD': 'github-actions',
};

function requiresMappedSelection(
	labels: string[] | undefined,
	map: Record<string, string>,
	selectedOptions: Set<string>,
): boolean {
	if (!labels?.length) return true;
	const mapped = labels.map((label) => map[label]).filter(Boolean);
	if (mapped.length === 0) return true;
	return mapped.some((opt) => selectedOptions.has(opt));
}

/**
 * Un produit CMS / framework / mobile / IA / DevOps ne doit pas remonter
 * uniquement parce qu'un langage parent (ex. PHP) est coché.
 */
export function isProductEligibleForStack(
	assembly: TechStackAssembly | null | undefined,
	selectedOptions: Set<string>,
): boolean {
	if (!assembly) return true;

	if (!requiresMappedSelection(assembly.cms, CMS_LABEL_TO_OPTION, selectedOptions)) {
		return false;
	}
	if (!requiresMappedSelection(assembly.backend, FRAMEWORK_LABEL_TO_OPTION, selectedOptions)) {
		return false;
	}
	if (!requiresMappedSelection(assembly.mobile, MOBILE_LABEL_TO_OPTION, selectedOptions)) {
		return false;
	}
	if (!requiresMappedSelection(assembly.ai, AI_LABEL_TO_OPTION, selectedOptions)) {
		return false;
	}
	if (!requiresMappedSelection(assembly.devops, DEVOPS_LABEL_TO_OPTION, selectedOptions)) {
		return false;
	}

	return true;
}
