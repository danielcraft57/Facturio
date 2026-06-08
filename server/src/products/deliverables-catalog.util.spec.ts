import { normalizeDeliverableLabelKey } from './deliverables-catalog.util';

describe('deliverables-catalog.util', () => {
	it('normalise le libellé en clé minuscule', () => {
		expect(normalizeDeliverableLabelKey('  Intégration WordPress  ')).toBe(
			'intégration wordpress',
		);
	});
});
