import {
	formatProductForResponse,
	normalizeProductWritePayload,
} from './product-payload-normalize.util';

describe('product-payload-normalize', () => {
	it('mappe livrables et technos', () => {
		const out = normalizeProductWritePayload({
			livrables: [{ livrable: 'Audit', montant: 400, heures: 6 }],
			technos: ['Python', 'TypeScript'],
		});
		expect((out as { details?: unknown }).details).toEqual([
			{ label: 'Audit', amount: 400, hours: 6 },
		]);
		expect((out as { techStack?: unknown }).techStack).toEqual({
			languages: ['Python', 'TypeScript'],
		});
		expect((out as { languages?: string[] }).languages).toEqual(['Python', 'TypeScript']);
	});

	it('reconstruit techStack en lecture si languages seuls', () => {
		const out = formatProductForResponse({
			id: 1,
			details: ['Livrable A'],
			techStack: null,
			languages: ['PHP', 'WordPress'],
		});
		expect(out.details).toEqual([{ label: 'Livrable A' }]);
		expect(out.techStack).toEqual({ languages: ['PHP', 'WordPress'] });
	});
});
