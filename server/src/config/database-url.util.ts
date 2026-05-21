/**
 * Normalise DATABASE_URL PostgreSQL pour la prod (pool Prisma, timeouts, monitoring).
 */
export function normalizeDatabaseUrl(url: string, isProd: boolean): string {
	if (!isProd || !url.startsWith('postgresql')) {
		return url;
	}

	try {
		const parsed = new URL(url);
		const setDefault = (key: string, value: string) => {
			if (!parsed.searchParams.has(key)) {
				parsed.searchParams.set(key, value);
			}
		};

		setDefault('schema', 'public');
		setDefault('connection_limit', process.env.DATABASE_POOL_SIZE?.trim() || '8');
		setDefault('pool_timeout', process.env.DATABASE_POOL_TIMEOUT_SEC?.trim() || '20');
		setDefault('connect_timeout', process.env.DATABASE_CONNECT_TIMEOUT_SEC?.trim() || '10');
		setDefault('application_name', process.env.DATABASE_APP_NAME?.trim() || 'facturio_api');

		return parsed.toString();
	} catch {
		return url;
	}
}

/** Masque le mot de passe pour les logs de démarrage. */
export function redactDatabaseUrl(url: string): string {
	if (!url.startsWith('postgresql')) {
		return url.startsWith('file:') ? 'sqlite (file:…)' : '(url masquée)';
	}
	try {
		const parsed = new URL(url);
		if (parsed.password) parsed.password = '***';
		return parsed.toString();
	} catch {
		return 'postgresql://***';
	}
}
