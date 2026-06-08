export type ProductDeliverable = {
	label: string;
	amount?: number | null;
	hours?: number | null;
};

export function parseProductDeliverables(details: unknown): ProductDeliverable[] {
	if (!details) return [];
	if (typeof details === 'string') {
		return details
			.split(/[\r\n,]+/)
			.map((s) => ({ label: s.trim() }))
			.filter((d) => d.label);
	}
	if (!Array.isArray(details)) return [];
	return details
		.map((item): ProductDeliverable | null => {
			if (typeof item === 'string') {
				const label = item.trim();
				return label ? { label } : null;
			}
			if (item && typeof item === 'object' && 'label' in item) {
				const raw = item as Record<string, unknown>;
				const label = String(raw.label ?? '').trim();
				if (!label) return null;
				const amount =
					raw.amount != null && raw.amount !== ''
						? Number(raw.amount)
						: undefined;
				const hours =
					raw.hours != null && raw.hours !== ''
						? Number(raw.hours)
						: undefined;
				return {
					label,
					...(amount != null && !Number.isNaN(amount) ? { amount } : {}),
					...(hours != null && !Number.isNaN(hours) ? { hours } : {}),
				};
			}
			const label = String(item).trim();
			return label ? { label } : null;
		})
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
