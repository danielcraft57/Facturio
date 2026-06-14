import { decodeGoogleOAuthState, encodeGoogleOAuthState } from './google-oauth-state.util';

describe('google-oauth-state.util', () => {
	it('encode puis decode conserve le code beta et les consentements', () => {
		const token = encodeGoogleOAuthState({
			intent: 'signup',
			betaInviteCode: 'DEV26',
			acceptTerms: true,
			acceptPrivacy: true,
			deviceFingerprint: 'fp_abc123',
		});
		const decoded = decodeGoogleOAuthState(token);
		expect(decoded).toMatchObject({
			intent: 'signup',
			betaInviteCode: 'DEV26',
			acceptTerms: true,
			acceptPrivacy: true,
			deviceFingerprint: 'fp_abc123',
		});
	});

	it('rejette un state falsifié', () => {
		const token = encodeGoogleOAuthState({ intent: 'signup' });
		const wrapper = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
			json: string;
			sig: string;
		};
		wrapper.sig = 'signature-invalide';
		const tampered = Buffer.from(JSON.stringify(wrapper), 'utf8').toString('base64url');
		expect(decodeGoogleOAuthState(tampered)).toBeNull();
	});
});
