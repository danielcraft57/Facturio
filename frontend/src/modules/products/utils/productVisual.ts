import type { Product, ProductVisualType } from '../../../types/product';
import { getLibraryImageData } from '../constants/productVisualLibrary';

export function resolveProductImageUrl(product: Pick<Product, 'visualType' | 'imageData'>): string | undefined {
  if (product.visualType === 'library' && product.imageData?.startsWith('library:')) {
    return getLibraryImageData(product.imageData);
  }
  if (product.visualType === 'custom' && product.imageData) {
    return product.imageData;
  }
  return undefined;
}

export function normalizeProductFromApi(raw: Record<string, unknown>): Product {
  const languages = Array.isArray(raw.languages)
    ? (raw.languages as string[])
    : typeof raw.languages === 'string'
      ? (raw.languages as string).split(',').map(s => s.trim()).filter(Boolean)
      : [];

  const details = Array.isArray(raw.details)
    ? (raw.details as string[])
    : typeof raw.details === 'string'
      ? (raw.details as string).split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean)
      : [];

  return {
    ...(raw as unknown as Product),
    languages,
    details,
    unitPrice: raw.unitPrice != null ? Number(raw.unitPrice) : undefined,
    estimatedHours: raw.estimatedHours != null ? Number(raw.estimatedHours) : undefined,
    visualType: (raw.visualType as ProductVisualType) || 'icon',
    iconName: (raw.iconName as string) || 'box',
  };
}
