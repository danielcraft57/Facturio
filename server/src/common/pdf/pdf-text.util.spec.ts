import { dedupeRepeatedDescription } from './pdf-text.util';

describe('dedupeRepeatedDescription', () => {
	it('supprime un libellé répété deux fois', () => {
		expect(dedupeRepeatedDescription('Textes pour votre site Textes pour votre site')).toBe(
			'Textes pour votre site',
		);
	});

	it('laisse une description normale intacte', () => {
		expect(dedupeRepeatedDescription('Rédaction web — 5 pages')).toBe('Rédaction web — 5 pages');
	});
});
