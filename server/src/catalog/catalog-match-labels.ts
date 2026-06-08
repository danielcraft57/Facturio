/** Libellés FR pour les règles de matching catalogue ↔ stack. */
export const CATALOG_MATCH_RULE_LABELS: Record<string, string> = {
	'offres-metier': 'Offres métier (non techniques)',
	'fullstack-ts': 'Stack TypeScript full-stack',
	'react-next': 'React / Next.js',
	'vue-nuxt': 'Vue / Nuxt',
	'python-stack': 'Python / API',
	'wordpress-cms': 'WordPress (sélectionné)',
	'prestashop-ecom': 'PrestaShop (sélectionné)',
	'laravel-backend': 'Laravel (sélectionné)',
	'shopify-ecom': 'E-commerce Shopify',
	'ai-stack': 'IA & automatisation',
	'static-vitrine': 'Site vitrine',
	mobile: 'Application mobile',
	devops: 'DevOps & déploiement',
	databases: 'Base de données',
	security: 'Cybersécurité',
	'support-maint': 'Support & maintenance',
};

export function labelCatalogMatchReason(ruleId: string): string {
	return CATALOG_MATCH_RULE_LABELS[ruleId] ?? ruleId;
}
