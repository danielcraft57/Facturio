import type { TechAssemblyCategory, TechStackAssembly } from './tech-assembly.types';

export function flattenTechAssembly(assembly: TechStackAssembly | null | undefined): string[] {
	if (!assembly) return [];
	const out: string[] = [];
	for (const values of Object.values(assembly)) {
		if (!values) continue;
		for (const v of values) {
			const norm = v.trim().toLowerCase();
			if (!out.some((x) => x.trim().toLowerCase() === norm)) out.push(v);
		}
	}
	return out;
}

export function isTechAssemblyEmpty(assembly: TechStackAssembly | null | undefined): boolean {
	return flattenTechAssembly(assembly).length === 0;
}

export function mergeTechAssemblies(...parts: (TechStackAssembly | undefined)[]): TechStackAssembly {
	const merged: TechStackAssembly = {};
	for (const part of parts) {
		if (!part) continue;
		for (const [cat, labels] of Object.entries(part) as [TechAssemblyCategory, string[]][]) {
			for (const label of labels ?? []) {
				const bucket = merged[cat] ?? [];
				const norm = label.trim().toLowerCase();
				if (!bucket.some((x) => x.trim().toLowerCase() === norm)) bucket.push(label);
				merged[cat] = bucket;
			}
		}
	}
	return merged;
}
