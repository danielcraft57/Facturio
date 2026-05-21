import { ApiAccessTokenService } from './api-access-token.service';

describe('ApiAccessTokenService', () => {
	describe('hashToken', () => {
		it('produit un hash stable pour le même jeton', () => {
			const a = ApiAccessTokenService.hashToken('fact_abc123');
			const b = ApiAccessTokenService.hashToken('fact_abc123');
			expect(a).toBe(b);
			expect(a).toHaveLength(64);
		});

		it('diffère pour deux jetons distincts', () => {
			const a = ApiAccessTokenService.hashToken('fact_one');
			const b = ApiAccessTokenService.hashToken('fact_two');
			expect(a).not.toBe(b);
		});
	});
});
