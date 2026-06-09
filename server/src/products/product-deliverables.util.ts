export type ProductDeliverable = {
	label: string;
	amount?: number | null;
	hours?: number | null;
};

const LABEL_KEYS = ['label', 'livrable', 'name', 'title', 'libelle'] as const;
const AMOUNT_KEYS = ['amount', 'montant', 'montantHT', 'montant_ht', 'price', 'prix'] as const;
const HOURS_KEYS = ['hours', 'heures', 'duree', 'duration'] as const;

function coerceString(value: unknown): string | null {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed || null;
	}
	if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
	return null;
}

function pickString(raw: Record<string, unknown>, keys: readonly string[]): string | null {
	for (const key of keys) {
		const v = coerceString(raw[key]);
		if (v) return v;
	}
	return null;
}

function pickNumber(raw: Record<string, unknown>, keys: readonly string[]): number | undefined {
	for (const key of keys) {
		const value = raw[key];
		if (value === undefined || value === null || value === '') continue;
		const num = Number(value);
		if (!Number.isNaN(num)) return num;
	}
	return undefined;
}

export function normalizeDeliverableItem(item: unknown): ProductDeliverable | null {
	if (typeof item === 'string') {
		const label = item.trim();
		return label ? { label } : null;
	}
	if (!item || typeof item !== 'object') return null;

	const raw = item as Record<string, unknown>;
	const label = pickString(raw, LABEL_KEYS);
	if (!label || label === '[object Object]') return null;

	const amount = pickNumber(raw, AMOUNT_KEYS);
	const hours = pickNumber(raw, HOURS_KEYS);
	return {
		label,
		...(amount != null ? { amount } : {}),
		...(hours != null ? { hours } : {}),
	};
}

export function parseProductDeliverables(details: unknown): ProductDeliverable[] {
	if (!details) return [];
	if (typeof details === 'string') {
		return details
			.split(/[\r\n,]+/)
			.map((s) => ({ label: s.trim() }))
			.filter((d) => d.label);
	}
	if (!Array.isArray(details)) {
		const single = normalizeDeliverableItem(details);
		return single ? [single] : [];
	}
	return details
		.map((item) => normalizeDeliverableItem(item))
		.filter((d): d is ProductDeliverable => d != null);
}

/** Somme HT si chaque ligne a un montant renseigné. */
export function sumDeliverableAmounts(items: ProductDeliverable[]): number | null {
	if (!items.length) return null;
	let total = 0;
	for (const item of items) {
		if (item.amount == null || Number.isNaN(item.amount)) return null;
		total += item.amount;
	}
	return total;
}

export function deliverablesHaveAmounts(items: ProductDeliverable[]): boolean {
	return items.some((d) => d.amount != null && !Number.isNaN(d.amount));
}

export function serializeProductDeliverables(items: ProductDeliverable[]): ProductDeliverable[] {
	return items
		.map((d) => ({
			label: d.label.trim(),
			...(d.amount != null && !Number.isNaN(d.amount) ? { amount: d.amount } : {}),
			...(d.hours != null && !Number.isNaN(d.hours) ? { hours: d.hours } : {}),
		}))
		.filter((d) => d.label);
}
