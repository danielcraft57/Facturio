import {
	getOnboardingProfileIds,
	isValidOnboardingProfileId,
	normalizeOnboardingProfileId,
	resolveOnboardingProfile,
} from './onboarding-profiles';

describe('onboarding-profiles', () => {
	it('expose les profils métiers élargis', () => {
		const ids = getOnboardingProfileIds();
		expect(ids).toContain('commercial');
		expect(ids).toContain('webdesigner');
		expect(ids).toContain('redacteur');
	});

	it('accepte les ids legacy', () => {
		expect(isValidOnboardingProfileId('freelance')).toBe(true);
		expect(normalizeOnboardingProfileId('studio')).toBe('studio-dev');
	});

	it('adapte les catégories tech au profil commercial', () => {
		const profile = resolveOnboardingProfile('commercial');
		expect(profile?.techCategories).toEqual(expect.arrayContaining(['cms', 'ai']));
		expect(profile?.techCategories).not.toContain('cybersecurity');
	});
});
