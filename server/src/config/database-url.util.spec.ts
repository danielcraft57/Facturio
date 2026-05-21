import { normalizeDatabaseUrl, redactDatabaseUrl } from './database-url.util';

describe('database-url.util', () => {
	it('ajoute les paramètres pool en prod PostgreSQL', () => {
		const url = normalizeDatabaseUrl(
			'postgresql://u:p@localhost:5432/facturio',
			true,
		);
		expect(url).toContain('schema=public');
		expect(url).toContain('connection_limit=8');
		expect(url).toContain('application_name=facturio_api');
	});

	it('ne modifie pas SQLite', () => {
		const url = normalizeDatabaseUrl('file:./dev.db', true);
		expect(url).toBe('file:./dev.db');
	});

	it('masque le mot de passe', () => {
		expect(
			redactDatabaseUrl('postgresql://facturio:secret@127.0.0.1:5432/facturio'),
		).toContain('***');
		expect(redactDatabaseUrl('postgresql://facturio:secret@127.0.0.1:5432/facturio')).not.toContain(
			'secret',
		);
	});
});
