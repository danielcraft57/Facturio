import { parseEmailHeaderAddress, resolveSmtpAuthUser } from './email-smtp.util';

describe('email-smtp.util', () => {
	const envBackup = { ...process.env };

	afterEach(() => {
		process.env = { ...envBackup };
	});

	it('parseEmailHeaderAddress extrait une adresse avec nom', () => {
		expect(parseEmailHeaderAddress('PrestaFacture <no-reply@prestafacture.com>')).toBe(
			'no-reply@prestafacture.com',
		);
	});

	it('resolveSmtpAuthUser conserve le login local par défaut', () => {
		process.env.SMTP_USER = 'facture';
		process.env.MAIL_FROM = 'no-reply@prestafacture.com';
		delete process.env.SMTP_AUTH_APPEND_DOMAIN;
		expect(resolveSmtpAuthUser()).toBe('facture');
	});

	it('resolveSmtpAuthUser complète le domaine si SMTP_AUTH_APPEND_DOMAIN=true', () => {
		process.env.SMTP_USER = 'facture';
		process.env.MAIL_FROM = 'no-reply@prestafacture.com';
		process.env.SMTP_AUTH_APPEND_DOMAIN = 'true';
		expect(resolveSmtpAuthUser()).toBe('facture@prestafacture.com');
	});

	it('resolveSmtpAuthUser conserve une adresse complète', () => {
		process.env.SMTP_USER = 'facture@prestafacture.com';
		expect(resolveSmtpAuthUser()).toBe('facture@prestafacture.com');
	});
});
