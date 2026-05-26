import type { GeneralLedgerAccountGroup } from '../../services/accounting'

export interface FlatLedgerRow {
  accountCode: string
  accountName: string
  date: string
  journal: string
  reference?: string
  description?: string
  debit: number
  credit: number
  balance: number
}

/** Aplatit le grand livre groupé par compte en lignes affichables. */
export function flattenGeneralLedger(groups: GeneralLedgerAccountGroup[]): FlatLedgerRow[] {
  const rows: FlatLedgerRow[] = []
  for (const group of groups) {
    let running = 0
    for (const line of group.lines ?? []) {
      running += line.debit - line.credit
      rows.push({
        accountCode: group.accountCode,
        accountName: group.accountName,
        date: line.date,
        journal: line.journalCode,
        reference: line.reference,
        description: line.memo,
        debit: line.debit,
        credit: line.credit,
        balance: Number(running.toFixed(2)),
      })
    }
  }
  return rows
}

/** Libellés français des codes comptables courants (PCG simplifié). */
export const ACCOUNT_CODE_HINTS: Record<string, string> = {
  '411': 'Clients',
  '401': 'Fournisseurs',
  '512': 'Banque',
  '706': 'Prestations de services',
  '707': 'Ventes de marchandises',
  '44571': 'TVA collectée',
  '44566': 'TVA déductible',
  '606': 'Achats non stockés',
  '615': 'Entretien & réparations',
  '622': 'Honoraires / services ext.',
  '641': 'Salaires',
  '645': 'Charges sociales',
  '421': 'Salaires à payer',
  '431': 'URSSAF / sécu sociale',
  '635': 'Autres impôts & taxes (CFE, C3S…)',
  '447': 'Impôts & taxes à payer',
}
