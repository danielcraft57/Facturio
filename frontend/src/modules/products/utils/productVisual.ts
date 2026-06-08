import type { Product, ProductVisualType } from '../../../types/product';
import type { TechStackAssembly } from '../../../types/techStack';
import { getLibraryImageData } from '../constants/productVisualLibrary';

export const ICON_GRADIENT_PREFIX = 'icon-gradient:';

export function parseIconGradient(imageData?: string | null): [string, string] | null {
  if (!imageData?.startsWith(ICON_GRADIENT_PREFIX)) return null;
  const parts = imageData.slice(ICON_GRADIENT_PREFIX.length).split(',');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

export function getProductIconGradientCss(product: Pick<Product, 'visualType' | 'imageData'>): string | null {
  if (product.visualType !== 'icon') return null;
  const gradient = parseIconGradient(product.imageData);
  if (!gradient) return null;
  return `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;
}

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

  const techStack =
    raw.techStack && typeof raw.techStack === 'object' && !Array.isArray(raw.techStack)
      ? (raw.techStack as TechStackAssembly)
      : undefined;

  return {
    ...(raw as unknown as Product),
    languages,
    techStack,
    details,
    unitPrice: raw.unitPrice != null ? Number(raw.unitPrice) : undefined,
    estimatedHours: raw.estimatedHours != null ? Number(raw.estimatedHours) : undefined,
    visualType: (raw.visualType as ProductVisualType) || 'icon',
    iconName: (raw.iconName as string) || 'box',
  };
}
