import { resolvePublicAppBaseUrl } from './public-app-url';

describe('resolvePublicAppBaseUrl', () => {
	const envBackup = { ...process.env };

	afterEach(() => {
		process.env = { ...envBackup };
	});

	it('priorise PUBLIC_APP_URL pour les liens email', () => {
		process.env.PUBLIC_APP_URL = 'https://prestafacture.com';
		process.env.FRONTEND_URL = 'https://facturio.danielcraft.fr';
		expect(resolvePublicAppBaseUrl()).toBe('https://prestafacture.com');
	});

	it('retombe sur FRONTEND_URL si PUBLIC_APP_URL absent', () => {
		delete process.env.PUBLIC_APP_URL;
		process.env.FRONTEND_URL = 'http://localhost:5173';
		expect(resolvePublicAppBaseUrl()).toBe('http://localhost:5173');
	});
});
