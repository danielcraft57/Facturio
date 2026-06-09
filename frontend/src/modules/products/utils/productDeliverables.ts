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

function normalizeDeliverableItem(item: unknown): ProductDeliverable | null {
  if (typeof item === 'string') {
    const label = item.trim();
    return label && label !== '[object Object]' ? { label } : null;
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
      .map(s => ({ label: s.trim() }))
      .filter(d => d.label && d.label !== '[object Object]');
  }
  if (!Array.isArray(details)) {
    const single = normalizeDeliverableItem(details);
    return single ? [single] : [];
  }
  return details
    .map(item => normalizeDeliverableItem(item))
    .filter((d): d is ProductDeliverable => d != null);
}

export function sumDeliverableAmounts(items: ProductDeliverable[]): number | null {
  if (!items.length) return null;
  let total = 0;
  for (const item of items) {
    if (item.amount == null || Number.isNaN(item.amount)) return null;
    total += item.amount;
  }
  return total;
}

/** Somme des montants renseignés (lignes sans montant ignorées). */
export function sumKnownDeliverableAmounts(items: ProductDeliverable[]): number {
  return items.reduce(
    (s, d) => s + (d.amount != null && !Number.isNaN(d.amount) ? d.amount : 0),
    0,
  );
}

export function sumDeliverableHours(items: ProductDeliverable[]): number {
  return items.reduce(
    (s, d) => s + (d.hours != null && !Number.isNaN(d.hours) ? d.hours : 0),
    0,
  );
}

export function labeledDeliverables(items: ProductDeliverable[]): ProductDeliverable[] {
  return items.filter(d => d.label.trim());
}

export function allLabeledRowsHaveAmounts(items: ProductDeliverable[]): boolean {
  const labeled = labeledDeliverables(items);
  if (!labeled.length) return false;
  return labeled.every(d => d.amount != null && !Number.isNaN(d.amount));
}

export function deliverablesHaveAmounts(items: ProductDeliverable[]): boolean {
  return items.some(d => d.amount != null && !Number.isNaN(d.amount));
}

export function serializeProductDeliverables(items: ProductDeliverable[]): ProductDeliverable[] {
  return items
    .map(d => ({
      label: d.label.trim(),
      ...(d.amount != null && !Number.isNaN(d.amount) ? { amount: d.amount } : {}),
      ...(d.hours != null && !Number.isNaN(d.hours) ? { hours: d.hours } : {}),
    }))
    .filter(d => d.label);
}

export function distributeAmountEvenly(
  items: ProductDeliverable[],
  total: number,
): ProductDeliverable[] {
  if (!items.length || total <= 0) return items;
  const share = Math.round((total / items.length) * 100) / 100;
  const rows = items.map((d, i) => ({
    ...d,
    amount: i === items.length - 1
      ? Math.round((total - share * (items.length - 1)) * 100) / 100
      : share,
  }));
  return rows;
}

export function distributeAmountByHours(
  items: ProductDeliverable[],
  total: number,
): ProductDeliverable[] {
  const hoursSum = items.reduce((s, d) => s + (d.hours ?? 0), 0);
  if (!items.length || total <= 0 || hoursSum <= 0) return items;
  let allocated = 0;
  return items.map((d, i) => {
    if (i === items.length - 1) {
      return { ...d, amount: Math.round((total - allocated) * 100) / 100 };
    }
    const amount = Math.round(((d.hours ?? 0) / hoursSum) * total * 100) / 100;
    allocated += amount;
    return { ...d, amount };
  });
}
