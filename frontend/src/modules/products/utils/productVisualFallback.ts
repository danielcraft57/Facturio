import type { Product, ProductVisualType } from '../../../types/product';
import legacyMeta from '../constants/legacy-catalog-meta.json';

type LegacyVisual = {
  visualType: string;
  imageData: string | null;
  iconName: string | null;
};

const LEGACY_VISUALS = legacyMeta.visuals as Record<string, LegacyVisual>;

function hasRichVisual(product: Pick<Product, 'visualType' | 'imageData'>): boolean {
  if (product.visualType === 'library' && product.imageData?.startsWith('library:')) return true;
  if (product.visualType === 'custom' && product.imageData) return true;
  if (product.visualType === 'icon' && product.imageData?.startsWith('icon-gradient:')) return true;
  return false;
}

/** Réapplique visuels catalogue (legacy v1) si la base n’a pas imageData / library. */
export function withProductVisualFallback<T extends Product>(product: T): T {
  if (hasRichVisual(product) || !product.sku) return product;
  const legacy = LEGACY_VISUALS[product.sku];
  if (!legacy) return product;
  return {
    ...product,
    visualType: (legacy.visualType as ProductVisualType) || product.visualType,
    imageData: legacy.imageData ?? product.imageData,
    iconName: legacy.iconName ?? product.iconName,
  };
}
