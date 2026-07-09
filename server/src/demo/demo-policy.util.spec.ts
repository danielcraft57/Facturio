import { ForbiddenException } from '@nestjs/common';
import {
	assertDemoOutboundEmailBlocked,
	assertDemoReadOnly,
	isDemoOrganization,
	isDemoUser,
} from './demo-policy.util';

/**
 * Vérifie les règles lecture seule et blocage email en mode démo.
 */
describe('demo-policy.util', () => {
	const demoUser = { isDemo: true, email: 'demo@facturio.local', organization: { name: 'Facturio Démo' } };
	const demoOrg = { name: 'Facturio Démo' };

	it('détecte un utilisateur démo', () => {
		expect(isDemoUser(demoUser)).toBe(true);
		expect(isDemoOrganization(demoOrg)).toBe(true);
	});

	it('bloque les mutations démo', () => {
		expect(() => assertDemoReadOnly(demoUser)).toThrow(ForbiddenException);
	});

	it('bloque les emails métier depuis l\'org démo', () => {
		expect(() => assertDemoOutboundEmailBlocked(demoOrg)).toThrow(ForbiddenException);
	});

	it('laisse passer une org classique', () => {
		expect(() => assertDemoReadOnly({ organization: { name: 'Mon agence' } })).not.toThrow();
		expect(() => assertDemoOutboundEmailBlocked({ name: 'Mon agence' })).not.toThrow();
	});
});
