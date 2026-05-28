import type { AccountingMovement } from '../../services/accounting'

export type MovementKind = 'sale' | 'payment' | 'refund' | 'credit_note' | 'other'

export function movementKindLabel(kind?: string): string {
  switch (kind) {
    case 'sale':
      return 'Vente'
    case 'payment':
      return 'Encaissement'
    case 'refund':
      return 'Remboursement'
    case 'credit_note':
      return 'Avoir'
    default:
      return 'Autre'
  }
}

export function movementKindColor(
  kind?: string,
): 'primary' | 'success' | 'warning' | 'error' | 'default' {
  switch (kind) {
    case 'sale':
      return 'primary'
    case 'payment':
      return 'success'
    case 'refund':
      return 'warning'
    case 'credit_note':
      return 'error'
    default:
      return 'default'
  }
}

export function filterMovementsByKind(
  movements: AccountingMovement[],
  kind: MovementKind | 'all',
): AccountingMovement[] {
  if (kind === 'all') return movements
  return movements.filter((m) => (m.movementKind ?? 'other') === kind)
}
