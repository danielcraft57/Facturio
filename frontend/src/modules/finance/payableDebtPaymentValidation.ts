const BALANCE_EPSILON = 0.01

export function parsePayablePaymentAmount(raw: string): number | null {
  const amount = Number(raw.replace(',', '.').trim())
  if (!Number.isFinite(amount) || amount <= 0) return null
  return amount
}

/** Message d'erreur affiché sous le champ montant, ou null si valide. */
export function validatePayablePaymentAmount(
  amount: number | null,
  balance: number,
  opts?: { status?: string },
): string | null {
  if (opts?.status === 'PAID') {
    return 'Cette dette est déjà soldée.'
  }
  if (opts?.status === 'CANCELLED') {
    return 'Cette dette est annulée.'
  }
  if (amount == null) {
    return 'Saisissez un montant strictement positif.'
  }
  if (amount > balance + BALANCE_EPSILON) {
    const rest = balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `Le montant ne peut pas dépasser le reste à payer (${rest} €).`
  }
  return null
}

export function canRecordPayablePayment(status: string, balance: number): boolean {
  return status !== 'PAID' && status !== 'CANCELLED' && balance > BALANCE_EPSILON
}

export function canCancelPayableDebt(status: string): boolean {
  return status === 'OPEN' || status === 'PARTIAL'
}
