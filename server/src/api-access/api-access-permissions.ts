/** Scopes disponibles pour les jetons API publique Facturio. */
export const API_ACCESS_SCOPES = [
	'clients.read',
	'clients.write',
	'produits.read',
	'produits.write',
	'factures.read',
	'factures.write',
	'factures.send',
	'devis.read',
	'devis.write',
	'devis.send',
] as const;

export type ApiAccessScope = (typeof API_ACCESS_SCOPES)[number];

export const API_ACCESS_SCOPE_LABELS: Record<ApiAccessScope, string> = {
	'clients.read': 'Clients — lecture',
	'clients.write': 'Clients — création / modification',
	'produits.read': 'Produits — lecture',
	'produits.write': 'Produits — création / modification',
	'factures.read': 'Factures — lecture',
	'factures.write': 'Factures — création / modification',
	'factures.send': 'Factures — envoi par email',
	'devis.read': 'Devis — lecture',
	'devis.write': 'Devis — création / modification',
	'devis.send': 'Devis — envoi par email',
};

export function parsePermissionsJson(raw: string): ApiAccessScope[] {
	try {
		const arr = JSON.parse(raw) as unknown;
		if (!Array.isArray(arr)) return [];
		return arr.filter((s): s is ApiAccessScope =>
			typeof s === 'string' && (API_ACCESS_SCOPES as readonly string[]).includes(s),
		);
	} catch {
		return [];
	}
}

export function serializePermissions(scopes: string[]): string {
	const valid = scopes.filter((s) => (API_ACCESS_SCOPES as readonly string[]).includes(s));
	return JSON.stringify(valid);
}

export function hasScope(permissions: ApiAccessScope[], required: ApiAccessScope): boolean {
	return permissions.includes(required);
}
