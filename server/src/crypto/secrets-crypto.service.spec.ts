import { SecretsCryptoService } from './secrets-crypto.service';

describe('SecretsCryptoService', () => {
	const prev = process.env.SECRETS_ENCRYPTION_KEY;

	afterEach(() => {
		if (prev === undefined) delete process.env.SECRETS_ENCRYPTION_KEY;
		else process.env.SECRETS_ENCRYPTION_KEY = prev;
	});

	it('round-trip avec clé hex', () => {
		process.env.SECRETS_ENCRYPTION_KEY = 'a'.repeat(64);
		const svc = new SecretsCryptoService();
		const enc = svc.encrypt('sk_test_secret');
		expect(enc).toMatch(/^enc:v1:/);
		expect(svc.decrypt(enc)).toBe('sk_test_secret');
	});

	it('laisse le plaintext legacy si non chiffré', () => {
		process.env.SECRETS_ENCRYPTION_KEY = 'b'.repeat(64);
		const svc = new SecretsCryptoService();
		expect(svc.decrypt('sk_live_plain')).toBe('sk_live_plain');
	});
});
