import type { Product } from '../types/product'
import type { FinanceSearchOptionBase } from './financeDocumentSearch'

/**
 * Construit une entrée de recherche autocomplete pour un produit catalogue.
 *
 * @param product - Produit source
 * @returns Option compatible `FinanceDocumentSearch`
 */
export function buildProductSearchOption(product: Product): FinanceSearchOptionBase {
  const details = (product.details ?? [])
    .map((d) => (typeof d === 'string' ? d : d.label))
    .join(' ')
  const langs = [...(product.languages ?? []), ...Object.values(product.techStack ?? {}).flat()].join(' ')

  const searchText = [
    product.name,
    product.sku,
    product.description,
    product.category,
    product.purpose,
    details,
    langs,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    id: String(product.id),
    label: product.name,
    sublabel: product.sku || product.category || undefined,
    searchText,
  }
}

/**
 * Liste d'options de recherche pour tous les produits visibles.
 *
 * @param products - Produits du catalogue courant
 */
export function buildProductSearchOptions(products: Product[]): FinanceSearchOptionBase[] {
  return products.map(buildProductSearchOption)
}
