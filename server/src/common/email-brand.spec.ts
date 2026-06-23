import { getPlatformBrandName } from './email-brand';

describe('getPlatformBrandName', () => {
	const envBackup = { ...process.env };

	afterEach(() => {
		process.env = { ...envBackup };
	});

	it('ignore MAIL_FROM_NAME quand c\'est un domaine', () => {
		process.env.MAIL_FROM_NAME = 'prestafacture.com';
		delete process.env.PLATFORM_BRAND_NAME;
		delete process.env.COMPANY_NAME;
		expect(getPlatformBrandName()).toBe('PrestaFacture');
	});

	it('utilise PLATFORM_BRAND_NAME si défini', () => {
		process.env.PLATFORM_BRAND_NAME = 'Ma Marque';
		expect(getPlatformBrandName()).toBe('Ma Marque');
	});
});
