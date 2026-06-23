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

	it('resolveSmtpAuthUser complète le domaine depuis MAIL_FROM', () => {
		process.env.SMTP_USER = 'facture';
		process.env.MAIL_FROM = 'no-reply@prestafacture.com';
		expect(resolveSmtpAuthUser()).toBe('facture@prestafacture.com');
	});

	it('resolveSmtpAuthUser conserve une adresse complète', () => {
		process.env.SMTP_USER = 'facture@prestafacture.com';
		expect(resolveSmtpAuthUser()).toBe('facture@prestafacture.com');
	});
});
