import {
	API_ACCESS_SCOPES,
	hasScope,
	parsePermissionsJson,
	serializePermissions,
} from './api-access-permissions';

describe('api-access-permissions', () => {
	it('parse et sérialise les scopes valides', () => {
		const raw = serializePermissions(['clients.read', 'factures.send', 'invalid']);
		expect(JSON.parse(raw)).toEqual(['clients.read', 'factures.send']);
		expect(parsePermissionsJson(raw)).toEqual(['clients.read', 'factures.send']);
	});

	it('hasScope vérifie la présence', () => {
		const perms = parsePermissionsJson(serializePermissions(['factures.read']));
		expect(hasScope(perms, 'factures.read')).toBe(true);
		expect(hasScope(perms, 'factures.send')).toBe(false);
	});

	it('expose tous les scopes métier', () => {
		expect(API_ACCESS_SCOPES).toContain('devis.send');
		expect(API_ACCESS_SCOPES.length).toBe(10);
	});
});
