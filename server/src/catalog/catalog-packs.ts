import * as fs from 'node:fs';
import * as path from 'node:path';

export type CatalogPackAudience = 'all' | 'junior';

export type CatalogPackDefinition = {
	id: string;
	name: string;
	description: string;
	priceHint: string;
	skus: string[];
	audience?: CatalogPackAudience;
	suggestedProfiles?: string[];
};

export type CatalogPacksFile = {
	version: number;
	packs: CatalogPackDefinition[];
};

const PACKS_PATH = path.join(__dirname, '..', '..', 'data', 'catalog', 'catalog-packs.json');

let cache: CatalogPacksFile | null = null;

export function getCatalogPacks(): CatalogPacksFile {
	if (!cache) {
		const raw = fs.readFileSync(PACKS_PATH, 'utf-8');
		cache = JSON.parse(raw) as CatalogPacksFile;
	}
	return cache;
}

export function getCatalogPackById(packId: string): CatalogPackDefinition | undefined {
	return getCatalogPacks().packs.find((p) => p.id === packId);
}

export function listCatalogPacks(): CatalogPackDefinition[] {
	return getCatalogPacks().packs;
}

export function listJuniorCatalogPacks(): CatalogPackDefinition[] {
	return getCatalogPacks().packs.filter((p) => p.audience === 'junior');
}
