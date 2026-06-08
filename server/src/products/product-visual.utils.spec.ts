import {
	formatIconGradient,
	isKnownLibraryId,
	parseIconGradient,
	pickRandomIconGradient,
	pickRandomLibraryId,
	pickRandomProductIconName,
	PRODUCT_ICON_GRADIENTS,
	PRODUCT_LIBRARY_IDS,
	resolveVisualOnCreate,
} from './product-visual.utils';

describe('product-visual.utils', () => {
	it('pickRandomProductIconName retourne un nom connu', () => {
		for (let i = 0; i < 10; i++) {
			expect(typeof pickRandomProductIconName()).toBe('string');
		}
	});

	it('pickRandomLibraryId retourne une clé bibliothèque', () => {
		const id = pickRandomLibraryId();
		expect(isKnownLibraryId(id)).toBe(true);
		expect(PRODUCT_LIBRARY_IDS).toContain(id);
	});

	it('formatIconGradient / parseIconGradient', () => {
		const raw = formatIconGradient(['#4f46e5', '#7c3aed']);
		expect(raw).toBe('icon-gradient:#4f46e5,#7c3aed');
		expect(parseIconGradient(raw)).toEqual(['#4f46e5', '#7c3aed']);
	});

	it('resolveVisualOnCreate — icône explicite avec dégradé', () => {
		const v = resolveVisualOnCreate({
			name: 'Test',
			sku: 'TEST-ICON',
			visualType: 'icon',
			iconName: 'robot',
		});
		expect(v.visualType).toBe('icon');
		expect(v.iconName).toBe('robot');
		expect(v.imageData).toMatch(/^icon-gradient:/);
	});

	it('resolveVisualOnCreate — bibliothèque explicite', () => {
		const v = resolveVisualOnCreate({
			name: 'Test',
			sku: 'TEST-LIB',
			visualType: 'library',
			imageData: 'library:seo',
		});
		expect(v.visualType).toBe('library');
		expect(v.imageData).toBe('library:seo');
		expect(v.iconName).toBeNull();
	});

	it('resolveVisualOnCreate — aléatoire sans visualType', () => {
		const types = new Set<string>();
		for (let i = 0; i < 30; i++) {
			types.add(resolveVisualOnCreate({ name: 'X', sku: 'TEST-RANDOM' }).visualType);
		}
		expect(types.has('icon')).toBe(true);
		expect(types.has('library')).toBe(true);
	});

	it('pickRandomIconGradient utilise la palette', () => {
		const g = pickRandomIconGradient();
		expect(PRODUCT_ICON_GRADIENTS.some(([a, b]) => a === g[0] && b === g[1])).toBe(true);
	});
});
