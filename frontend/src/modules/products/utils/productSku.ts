export const PRODUCT_SKU_PATTERN = /^[A-Z][A-Z0-9]*-[A-Z0-9]+(-[A-Z0-9]+)*$/;

export const PRODUCT_SKU_MAX_LENGTH = 48;

export const PRODUCT_SKU_FORMAT_HINT =
  'Format obligatoire : MAJUSCULES et tirets (ex. STACK-WP-VITRINE, DEV-REACT-001)';

export function normalizeProductSkuInput(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, PRODUCT_SKU_MAX_LENGTH);
}

export function normalizeProductSku(raw: unknown): string {
  if (raw == null) return '';
  return normalizeProductSkuInput(String(raw).trim()).replace(/^-+|-+$/g, '');
}

export function isValidProductSku(raw: unknown): boolean {
  const sku = normalizeProductSku(raw);
  if (sku.length < 5 || sku.length > PRODUCT_SKU_MAX_LENGTH) return false;
  return PRODUCT_SKU_PATTERN.test(sku);
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Proposition de SKU à partir du nom (modifiable par l’utilisateur ensuite). */
export function suggestProductSkuFromName(name: string): string {
  const trimmed = stripAccents(name.trim());
  if (!trimmed) return '';

  const segments = trimmed
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .map(s => s.replace(/[^A-Z0-9]/g, ''))
    .filter(Boolean);

  if (!segments.length) return '';

  const joined =
    segments.length >= 2 ? segments.join('-') : `PRD-${segments[0]}`;

  return normalizeProductSku(joined);
}
