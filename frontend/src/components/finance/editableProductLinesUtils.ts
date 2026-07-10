import type { EditableLine } from './EditableProductLinesTable'

export function isProductLineEmpty(line: EditableLine): boolean {
  return !String(line.description ?? '').trim() && Number(line.unitPrice) === 0
}

export function isProductLineStarted(line: EditableLine): boolean {
  return String(line.description ?? '').trim().length > 0 || Number(line.unitPrice) > 0
}

/** Lignes à enregistrer (ignore les lignes vides). */
export function filterProductLinesForSubmit<T extends EditableLine>(lines: T[]): T[] {
  return lines.filter((l) => String(l.description ?? '').trim().length > 0)
}

function collapseTrailingEmptyLines<T extends EditableLine>(lines: T[]): T[] {
  const next = [...lines]
  while (
    next.length > 1 &&
    isProductLineEmpty(next[next.length - 1]) &&
    isProductLineEmpty(next[next.length - 2])
  ) {
    next.pop()
  }
  return next
}

/** Garde une ligne vide en fin de liste si la dernière ligne est remplie. */
export function ensureTrailingEmptyLine<T extends EditableLine>(
  lines: T[],
  createEmpty: () => T,
): T[] {
  if (lines.length === 0) return [createEmpty()]
  const next = collapseTrailingEmptyLines(lines)
  const last = next[next.length - 1]
  if (isProductLineStarted(last)) {
    return [...next, createEmpty()]
  }
  return next
}

export function applyProductLineFieldChange<T extends EditableLine>(
  lines: T[],
  index: number,
  updater: (line: T) => T,
  createEmpty: () => T,
): T[] {
  const next = [...lines]
  if (index < 0 || index >= next.length) return ensureTrailingEmptyLine(next, createEmpty)
  next[index] = updater({ ...next[index] })
  return ensureTrailingEmptyLine(next, createEmpty)
}

export function removeProductLine<T extends EditableLine>(
  lines: T[],
  index: number,
  createEmpty: () => T,
): T[] {
  if (lines.length <= 1) return lines
  const next = lines.filter((_, i) => i !== index)
  return ensureTrailingEmptyLine(next, createEmpty)
}

export function canRemoveProductLine(lines: EditableLine[], index: number): boolean {
  if (lines.length <= 1) return false
  const isTrailingEmpty = index === lines.length - 1 && isProductLineEmpty(lines[index])
  const hasFilled = filterProductLinesForSubmit(lines).length > 0
  if (isTrailingEmpty && !hasFilled) return false
  return true
}

/**
 * Normalise une quantité de ligne produit (entier >= 1).
 *
 * @param value - Valeur saisie
 */
export function normalizeProductLineQuantity(value: string | number): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.round(Math.min(n, 9999))
}

/**
 * Calcule sous-total HT, TVA et total TTC des lignes renseignées.
 *
 * @param lines - Lignes du formulaire
 */
export function calculateProductLinesTotals(lines: EditableLine[]) {
  const active = filterProductLinesForSubmit(lines)
  const subtotal = active.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const taxTotal = active.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice
    return sum + (itemTotal * item.taxRate) / 100
  }, 0)
  return { subtotal, taxTotal, total: subtotal + taxTotal }
}

/**
 * Calcule totaux devis (taux TVA décimal, ex. 0,2 = 20 %).
 *
 * @param lines - Lignes du formulaire
 */
export function calculateQuoteLinesTotals(lines: EditableLine[]) {
  const active = filterProductLinesForSubmit(lines)
  const subtotal = active.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const taxTotal = active.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice
    return sum + itemTotal * item.taxRate
  }, 0)
  return { subtotal, taxTotal, total: subtotal + taxTotal }
}
