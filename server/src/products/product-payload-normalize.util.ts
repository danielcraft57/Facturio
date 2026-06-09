import type { TechStackAssembly } from '../catalog/tech-assembly.types';
import { flattenTechAssembly, isTechAssemblyEmpty } from '../catalog/tech-assembly.utils';
import type { TechStackDto } from './dto/tech-stack.dto';
import {
	normalizeDeliverableItem,
	parseProductDeliverables,
	serializeProductDeliverables,
	type ProductDeliverable,
} from './product-deliverables.util';

const TECH_LAYERS = [
	'languages',
	'frontend',
	'backend',
	'cms',
	'databases',
	'devops',
	'ai',
	'mobile',
	'security',
] as const;

function coerceString(value: unknown): string | null {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed || null;
	}
	if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
	return null;
}

/** Normalise details / livrables (chaînes, objets, alias FR). */
export function normalizeDetailsInput(details: unknown): ProductDeliverable[] | undefined {
	if (details === undefined) return undefined;
	if (details === null || details === '') return [];

	let items: unknown[] = [];
	if (Array.isArray(details)) {
		items = details;
	} else if (typeof details === 'string') {
		return serializeProductDeliverables(parseProductDeliverables(details));
	} else if (typeof details === 'object') {
		const obj = details as Record<string, unknown>;
		if (['label', 'livrable', 'name', 'title', 'libelle'].some((k) => k in obj)) {
			items = [obj];
		} else {
			items = Object.values(obj);
		}
	}

	return serializeProductDeliverables(
		items.map(normalizeDeliverableItem).filter((d): d is ProductDeliverable => d != null),
	);
}

function normalizeTechStackLayers(stack: TechStackDto | TechStackAssembly): TechStackAssembly {
	const out: TechStackAssembly = {};
	for (const layer of TECH_LAYERS) {
		const raw = (stack as Record<string, unknown>)[layer];
		if (!raw) continue;
		const values = Array.isArray(raw)
			? raw.map((v) => coerceString(v)).filter((v): v is string => !!v)
			: typeof raw === 'string'
				? raw.split(',').map((s) => s.trim()).filter(Boolean)
				: [];
		if (values.length) out[layer] = values;
	}
	return out;
}

export type ProductWriteShape = {
	details?: unknown;
	livrables?: unknown;
	techStack?: TechStackDto | TechStackAssembly | null;
	languages?: string[];
	technos?: string[];
};

export function normalizeProductWritePayload<T extends ProductWriteShape>(data: T): T {
	const next = { ...data };

	if (next.livrables !== undefined && next.details === undefined) {
		next.details = next.livrables;
	}
	delete next.livrables;

	if (next.details !== undefined) {
		next.details = normalizeDetailsInput(next.details) ?? [];
	}

	const flatFromAliases = [...(next.languages ?? []), ...(next.technos ?? [])]
		.map((v) => v?.trim())
		.filter((v): v is string => !!v);

	let stack =
		next.techStack != null && typeof next.techStack === 'object'
			? normalizeTechStackLayers(next.techStack)
			: null;

	if (isTechAssemblyEmpty(stack) && flatFromAliases.length) {
		stack = { languages: flatFromAliases };
	}

	if (stack && !isTechAssemblyEmpty(stack)) {
		next.techStack = stack;
	} else if (next.techStack !== undefined) {
		next.techStack = null;
	}

	const flattened = flattenTechAssembly(stack);
	next.languages = flattened.length ? flattened : flatFromAliases.length ? flatFromAliases : next.languages;
	delete next.technos;

	return next;
}

/** Réponse API : details propres + techStack reconstruit depuis languages si besoin. */
export function formatProductForResponse<T extends {
	details?: unknown;
	techStack?: unknown;
	languages?: unknown;
}>(product: T): T {
	const details = serializeProductDeliverables(parseProductDeliverables(product.details));
	let techStack = (product.techStack ?? null) as TechStackAssembly | null;
	const languages = Array.isArray(product.languages)
		? (product.languages as unknown[]).map((v) => String(v).trim()).filter(Boolean)
		: [];

	if (isTechAssemblyEmpty(techStack) && languages.length) {
		techStack = { languages };
	}

	const flat = flattenTechAssembly(techStack);
	return {
		...product,
		details,
		techStack: isTechAssemblyEmpty(techStack) ? null : techStack,
		languages: flat.length ? flat : languages,
	};
}
