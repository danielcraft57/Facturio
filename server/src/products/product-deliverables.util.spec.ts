import {
	parseProductDeliverables,
	sumDeliverableAmounts,
} from './product-deliverables.util';

describe('product-deliverables', () => {
	it('parse chaînes et objets', () => {
		expect(parseProductDeliverables(['Auth', 'API'])).toEqual([
			{ label: 'Auth' },
			{ label: 'API' },
		]);
		expect(
			parseProductDeliverables([
				{ label: 'Design', amount: 800, hours: 10 },
				'Intégration',
			]),
		).toEqual([
			{ label: 'Design', amount: 800, hours: 10 },
			{ label: 'Intégration' },
		]);
	});

	it('somme les montants si toutes les lignes en ont', () => {
		const items = [
			{ label: 'A', amount: 1000 },
			{ label: 'B', amount: 1500 },
		];
		expect(sumDeliverableAmounts(items)).toBe(2500);
		expect(sumDeliverableAmounts([{ label: 'A', amount: 100 }, { label: 'B' }])).toBeNull();
	});
});
