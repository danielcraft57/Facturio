import * as fs from 'node:fs';
import * as path from 'node:path';

export type TechStackOption = {
	id: string;
	label: string;
	matchTags: string[];
};

export type TechStackCategory = {
	id: string;
	label: string;
	hint?: string;
	maxSelect?: number;
	options: TechStackOption[];
};

export type TechStackChoicesFile = {
	version: number;
	audience: string;
	title: string;
	subtitle: string;
	minTotalSelect: number;
	maxTotalSelect: number;
	categories: TechStackCategory[];
};

export type CatalogMatchRule = {
	id: string;
	whenAnyOption: string[];
	skus: string[];
	weight: number;
};

export type CatalogMatchRulesFile = {
	version: number;
	maxCatalogItems: number;
	budgetMaxUnitPrice: number;
	alwaysIncludeSkus: string[];
	starterProfileSkus: string[];
	rules: CatalogMatchRule[];
	languageOverlapWeight: number;
	budgetFriendlyBonus: number;
	ruleMatchBonus: number;
};

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'catalog');

let techChoicesCache: TechStackChoicesFile | null = null;
let matchRulesCache: CatalogMatchRulesFile | null = null;

function readJson<T>(filename: string): T {
	const filePath = path.join(DATA_DIR, filename);
	const raw = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(raw) as T;
}

export function getTechStackChoices(): TechStackChoicesFile {
	if (!techChoicesCache) {
		techChoicesCache = readJson<TechStackChoicesFile>('tech-stack-choices.json');
	}
	return techChoicesCache;
}

export function getCatalogMatchRules(): CatalogMatchRulesFile {
	if (!matchRulesCache) {
		matchRulesCache = readJson<CatalogMatchRulesFile>('catalog-match-rules.json');
	}
	return matchRulesCache;
}

/** Index option id → matchTags (normalisés en minuscules pour comparaison). */
export function buildOptionTagIndex(): Map<string, string[]> {
	const choices = getTechStackChoices();
	const index = new Map<string, string[]>();
	for (const cat of choices.categories) {
		for (const opt of cat.options) {
			index.set(
				opt.id,
				opt.matchTags.map((t) => t.toLowerCase()),
			);
		}
	}
	return index;
}

export function getAllValidOptionIds(): Set<string> {
	return new Set(buildOptionTagIndex().keys());
}

export function resolveMatchTagsFromOptionIds(optionIds: string[]): Set<string> {
	const index = buildOptionTagIndex();
	const tags = new Set<string>();
	for (const id of optionIds) {
		const entry = index.get(id);
		if (entry) {
			for (const t of entry) tags.add(t);
		}
	}
	return tags;
}

export function validateTechnologyIds(ids: string[]): { valid: boolean; invalid: string[] } {
	const allowed = getAllValidOptionIds();
	const invalid = ids.filter((id) => !allowed.has(id));
	return { valid: invalid.length === 0, invalid };
}
