import * as fs from 'node:fs';
import * as path from 'node:path';

export type OnboardingProfileGroup = {
	id: string;
	label: string;
};

export type OnboardingProfileDef = {
	id: string;
	legacyIds?: string[];
	groupId: string;
	label: string;
	description: string;
	techCategories: string[];
	suggestedTechIds: string[];
};

export type OnboardingProfilesFile = {
	version: number;
	groups: OnboardingProfileGroup[];
	profiles: OnboardingProfileDef[];
};

const DATA_PATH = path.join(__dirname, '..', '..', 'data', 'catalog', 'onboarding-profiles.json');

let cache: OnboardingProfilesFile | null = null;

export function getOnboardingProfilesFile(): OnboardingProfilesFile {
	if (!cache) {
		cache = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')) as OnboardingProfilesFile;
	}
	return cache;
}

export function getOnboardingProfileIds(): string[] {
	return getOnboardingProfilesFile().profiles.map((p) => p.id);
}

export function normalizeOnboardingProfileId(profileId: string | null | undefined): string | null {
	if (!profileId) return null;
	const file = getOnboardingProfilesFile();
	const direct = file.profiles.find((p) => p.id === profileId);
	if (direct) return direct.id;
	const legacy = file.profiles.find((p) => p.legacyIds?.includes(profileId));
	return legacy?.id ?? profileId;
}

export function resolveOnboardingProfile(
	profileId: string | null | undefined,
): OnboardingProfileDef | null {
	const normalized = normalizeOnboardingProfileId(profileId);
	if (!normalized) return null;
	return getOnboardingProfilesFile().profiles.find((p) => p.id === normalized) ?? null;
}

export function isValidOnboardingProfileId(profileId: string): boolean {
	const normalized = normalizeOnboardingProfileId(profileId);
	if (!normalized) return false;
	return getOnboardingProfileIds().includes(normalized);
}
