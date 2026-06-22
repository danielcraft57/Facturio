import {
	buildEmailOpenTrackUrl,
	normalizeEmailTrackToken,
	resolveTrackApiBase,
} from './email-track.util';

describe('email-track.util', () => {
	const env = process.env;

	afterEach(() => {
		process.env = env;
	});

	it('normalise les = du quoted-printable dans le token', () => {
		expect(normalizeEmailTrackToken('abcd=ef012345')).toBe('abcdef012345');
	});

	it('préfère API_PUBLIC_URL pour le pixel (emails lus hors LAN)', () => {
		process.env.API_PUBLIC_URL = 'https://prestafacture.com/api';
		process.env.API_URL = 'http://node10.lan:3000/api';
		expect(resolveTrackApiBase()).toBe('https://prestafacture.com');
		expect(buildEmailOpenTrackUrl('quote', 'abc123')).toBe(
			'https://prestafacture.com/api/track/opened/quote/abc123',
		);
		expect(buildEmailOpenTrackUrl('payable_debt', 'debt99')).toBe(
			'https://prestafacture.com/api/track/opened/payable_debt/debt99',
		);
	});
});
