import { isProductEligibleForStack } from './catalog-stack-eligibility';

describe('isProductEligibleForStack', () => {
	it('exclut WordPress si seul PHP est coché', () => {
		const ok = isProductEligibleForStack(
			{ languages: ['PHP'], cms: ['WordPress'] },
			new Set(['php', 'html-css']),
		);
		expect(ok).toBe(false);
	});

	it('inclut WordPress si wordpress est coché', () => {
		const ok = isProductEligibleForStack(
			{ languages: ['PHP'], cms: ['WordPress'] },
			new Set(['wordpress', 'php']),
		);
		expect(ok).toBe(true);
	});

	it('exclut PrestaShop sans sélection PrestaShop', () => {
		const ok = isProductEligibleForStack(
			{ languages: ['PHP'], cms: ['PrestaShop'] },
			new Set(['php']),
		);
		expect(ok).toBe(false);
	});

	it('exclut Laravel sans sélection Laravel', () => {
		const ok = isProductEligibleForStack(
			{ languages: ['PHP'], backend: ['Laravel'] },
			new Set(['php']),
		);
		expect(ok).toBe(false);
	});
});
