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
      .map(s => ({ label: s.trim() }))
      .filter(d => d.label);
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
          raw.amount != null && raw.amount !== '' ? Number(raw.amount) : undefined;
        const hours =
          raw.hours != null && raw.hours !== '' ? Number(raw.hours) : undefined;
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
