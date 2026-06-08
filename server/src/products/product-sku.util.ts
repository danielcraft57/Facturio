/** Segments en MAJUSCULES séparés par des tirets (ex. STACK-WP-VITRINE, DEV-REACT-001). */
export const PRODUCT_SKU_PATTERN = /^[A-Z][A-Z0-9]*-[A-Z0-9]+(-[A-Z0-9]+)*$/;

export const PRODUCT_SKU_MAX_LENGTH = 48;

export const PRODUCT_SKU_FORMAT_HINT =
	'Format obligatoire : MAJUSCULES et tirets (ex. STACK-WP-VITRINE, DEV-REACT-001)';

export function normalizeProductSku(raw: unknown): string {
	if (raw == null) return '';
	return String(raw)
		.trim()
		.toUpperCase()
		.replace(/\s+/g, '-')
		.replace(/[^A-Z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, PRODUCT_SKU_MAX_LENGTH);
}

export function isValidProductSku(raw: unknown): boolean {
	const sku = normalizeProductSku(raw);
	if (sku.length < 5 || sku.length > PRODUCT_SKU_MAX_LENGTH) return false;
	return PRODUCT_SKU_PATTERN.test(sku);
}
