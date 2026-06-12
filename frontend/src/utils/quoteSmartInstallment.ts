/** Aperçu d'échéance renvoyé par l'API publique devis. */
export type SmartInstallmentPreviewRow = {
  sequence: number
  amount: number
  dueDate: string
  /** Libellé affiché (ex. Acompte). */
  label?: string
}

export type SmartInstallmentHint = {
  eligible: boolean
  count: number
  intervalMonths: number
  label: string
  preview: SmartInstallmentPreviewRow[]
}

/**
 * Répartit un montant en N parts égales (dernière ligne ajustée).
 *
 * @param total - Montant à répartir
 * @param count - Nombre de parts
 */
function splitEqual(total: number, count: number): number[] {
  const base = Math.floor((total / count) * 100) / 100
  const amounts: number[] = []
  let allocated = 0
  for (let i = 0; i < count; i++) {
    const amount =
      i === count - 1 ? Number((total - allocated).toFixed(2)) : base
    allocated += amount
    amounts.push(amount)
  }
  return amounts
}

/**
 * Recalcule l'aperçu avec acompte : ligne acompte immédiate + mensualités sur le solde.
 *
 * @param preview - Mensualités sans acompte
 * @param total - Total TTC devis
 * @param depositRate - Taux d'acompte (ex. 0.1)
 */
export function previewInstallmentWithDeposit(
  preview: SmartInstallmentPreviewRow[],
  total: number,
  depositRate = 0.1,
): SmartInstallmentPreviewRow[] {
  if (!preview.length) return []
  const deposit = Number((total * depositRate).toFixed(2))
  const remaining = Number((total - deposit).toFixed(2))
  const monthlyAmounts = splitEqual(remaining, preview.length)
  const firstMonthlyDue = preview[0]?.dueDate ?? new Date().toISOString()

  const rows: SmartInstallmentPreviewRow[] = [
    {
      sequence: 1,
      amount: deposit,
      dueDate: new Date().toISOString(),
      label: 'Acompte',
    },
  ]

  preview.forEach((row, index) => {
    rows.push({
      sequence: index + 2,
      amount: monthlyAmounts[index] ?? row.amount,
      dueDate: row.dueDate,
      label: `Mensualité ${index + 1}`,
    })
  })

  // Si l'API n'a qu'une date de départ, décaler visuellement les mensualités
  if (preview.length > 0 && firstMonthlyDue) {
    rows[1] = { ...rows[1], dueDate: firstMonthlyDue }
  }

  return rows
}

/**
 * Montant affiché pour le paiement immédiat (acompte ou 1re échéance).
 */
export function resolveInitialInstallmentPayment(
  total: number,
  preview: SmartInstallmentPreviewRow[],
  withDeposit: boolean,
  depositRate = 0.1,
): number {
  if (withDeposit) return Number((total * depositRate).toFixed(2))
  return preview[0]?.amount ?? 0
}
