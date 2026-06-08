import { describe, expect, it } from 'vitest';
import type { DeliverableCatalogItem } from '../types/product';

/** Logique extraite de productService — le backend renvoie un tableau brut, pas { success, data }. */
function parseDeliverableCatalogResponse(
  res: { success?: boolean; data?: DeliverableCatalogItem[] } | DeliverableCatalogItem[],
): DeliverableCatalogItem[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

describe('parseDeliverableCatalogResponse', () => {
  it('accepte un tableau brut NestJS', () => {
    const items = [{ id: 1, label: 'API REST', defaultAmount: 800, defaultHours: 10 }];
    expect(parseDeliverableCatalogResponse(items)).toEqual(items);
  });

  it('accepte le format ApiResponse enveloppé', () => {
    const items = [{ id: 2, label: 'Thème', defaultAmount: null, defaultHours: 8 }];
    expect(parseDeliverableCatalogResponse({ success: true, data: items })).toEqual(items);
  });
});
