/** Clé de dédoublonnage insensible à la casse pour un libellé de livrable. */
export function normalizeDeliverableLabelKey(label: string): string {
	return label.trim().toLowerCase();
}
