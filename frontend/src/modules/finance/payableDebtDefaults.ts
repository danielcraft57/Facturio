export { PAYABLE_DEBT_DUE_DATE_HELPER } from './payableDebtLegalCopy'

/** Échéance par défaut : J+5 ans (prescription ordinaire, art. 2224 C. civ.). */
export function defaultPayableDebtDueDateIso(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 5)
  return d.toISOString().split('T')[0]
}
