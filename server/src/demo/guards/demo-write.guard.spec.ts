import { ForbiddenException } from '@nestjs/common';
import { DemoWriteGuard } from './demo-write.guard';

/**
 * Vérifie le blocage des écritures en mode démo.
 */
describe('DemoWriteGuard', () => {
	const guard = new DemoWriteGuard();

	function ctx(method: string, path: string, user?: object) {
		return {
			switchToHttp: () => ({
				getRequest: () => ({ method, path, user }),
			}),
		} as any;
	}

	it('autorise GET pour un utilisateur démo', () => {
		expect(
			guard.canActivate(
				ctx('GET', '/api/invoices', { isDemo: true, organization: { name: 'Facturio Démo' } }),
			),
		).toBe(true);
	});

	it('bloque POST devis en démo', () => {
		expect(() =>
			guard.canActivate(
				ctx('POST', '/api/quotes', { isDemo: true, organization: { name: 'Facturio Démo' } }),
			),
		).toThrow(ForbiddenException);
	});

	it('bloque POST client en démo', () => {
		expect(() =>
			guard.canActivate(
				ctx('POST', '/api/clients', { isDemo: true, organization: { name: 'Facturio Démo' } }),
			),
		).toThrow(ForbiddenException);
	});

	it('bloque POST facture en démo', () => {
		expect(() =>
			guard.canActivate(
				ctx('POST', '/api/invoices', { isDemo: true, organization: { name: 'Facturio Démo' } }),
			),
		).toThrow(ForbiddenException);
	});

	it('autorise la prévisualisation d\'échéancier', () => {
		expect(
			guard.canActivate(
				ctx('POST', '/api/invoices/abc/installments/preview-equal', {
					isDemo: true,
					organization: { name: 'Facturio Démo' },
				}),
			),
		).toBe(true);
	});

	it('laisse passer les écritures hors démo', () => {
		expect(
			guard.canActivate(
				ctx('POST', '/api/invoices', { organization: { name: 'Mon agence' } }),
			),
		).toBe(true);
	});
});
