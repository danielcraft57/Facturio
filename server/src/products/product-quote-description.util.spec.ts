import {
	buildProductQuoteLineDescription,
	buildProductQuoteLineDisplay,
	explainTechForLayperson,
} from './product-quote-description.util';

describe('product-quote-description', () => {
	it('formate stack, livrables et résumé pour un devis', () => {
		const display = buildProductQuoteLineDisplay({
			name: 'MVP SaaS React + NestJS',
			description: 'Application métier clé en main.',
			details: [
				{ label: 'Auth JWT', amount: 1200 },
				{ label: 'API REST documentée', amount: 800 },
			],
			techStack: {
				languages: ['TypeScript'],
				frontend: ['React'],
				backend: ['NestJS'],
				databases: ['PostgreSQL'],
			},
		});

		expect(display.title).toBe('MVP SaaS React + NestJS');
		expect(display.deliverables).toHaveLength(2);
		expect(display.priceBreakdownTotal).toBe(2000);
		expect(display.techLayers?.length).toBeGreaterThanOrEqual(3);

		const text = buildProductQuoteLineDescription({
			name: 'MVP SaaS React + NestJS',
			description: 'Application métier clé en main.',
			details: ['Auth JWT'],
			techStack: { frontend: ['React'] },
		});
		expect(text).toContain('Technologies');
		expect(text).toContain('React');
	});

	it('explique les technos en langage simple', () => {
		expect(explainTechForLayperson('React')).toMatch(/interface/i);
		expect(explainTechForLayperson('TechnoExotique')).toBe('');
		expect(explainTechForLayperson('MySQL')).toMatch(/base de données/i);
	});
});
