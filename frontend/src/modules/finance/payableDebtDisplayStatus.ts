import type { EmailEngagement } from '../documents/documentEmailEngagement'

export type PayableDebtStatusSource = {
  status: string
  emailEngagement?: EmailEngagement | null
  emailSent?: boolean
  emailOpened?: boolean
  emailClicked?: boolean
}

export type PayableDebtDisplayStatus = {
  label: string
  color: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'
}

/** Parcours email reconnaissance de dette, puis solde à régler. */
export function resolvePayableDebtDisplayStatus(row: PayableDebtStatusSource): PayableDebtDisplayStatus {
  if (row.status === 'PAID') {
    return { label: 'Soldée', color: 'success' }
  }
  if (row.status === 'CANCELLED') {
    return { label: 'Annulée', color: 'default' }
  }

  const eng = row.emailEngagement
  const emailSent = eng?.emailSent ?? row.emailSent
  const opened = eng?.opened ?? row.emailOpened
  const clicked = eng?.clicked ?? row.emailClicked

  if (clicked) {
    return { label: 'Cliqué', color: 'info' }
  }
  if (opened) {
    return { label: 'Vu', color: 'info' }
  }
  if (emailSent) {
    return { label: 'Envoyé', color: 'primary' }
  }

  if (row.status === 'PARTIAL') {
    return { label: 'Partiel', color: 'warning' }
  }
  return { label: 'À régler', color: 'default' }
}
