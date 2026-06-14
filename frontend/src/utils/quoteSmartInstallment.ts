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
 */
function splitEqual(total: number, count: number): number[] {
  const base = Math.floor((total / count) * 100) / 100
  const amounts: number[] = []
  let allocated = 0
  for (let i = 0; i < count; i++) {
    const amount = i === count - 1 ? Number((total - allocated).toFixed(2)) : base
    allocated += amount
    amounts.push(amount)
  }
  return amounts
}

/**
 * Aperçu avec acompte ACO séparé : 1re mensualité réduite, solde réparti ensuite.
 */
export function previewInstallmentWithDeposit(
  preview: SmartInstallmentPreviewRow[],
  total: number,
  depositRate = 0.1,
): SmartInstallmentPreviewRow[] {
  if (!preview.length) return []
  const deposit = Number((total * depositRate).toFixed(2))
  const remainder = Number((total - deposit).toFixed(2))
  const count = preview.length
  const equalOnFull = splitEqual(total, count)
  const firstAmount = Number((equalOnFull[0] - deposit).toFixed(2))
  const tailAmounts =
    count === 2
      ? [Number((remainder - firstAmount).toFixed(2))]
      : splitEqual(Number((remainder - firstAmount).toFixed(2)), count - 1)

  const rows: SmartInstallmentPreviewRow[] = [
    {
      sequence: 1,
      amount: deposit,
      dueDate: new Date().toISOString(),
      label: 'Acompte (ACO)',
    },
    {
      sequence: 2,
      amount: firstAmount,
      dueDate: preview[0]?.dueDate ?? new Date().toISOString(),
      label: 'Mensualité 1',
    },
  ]

  tailAmounts.forEach((amount, index) => {
    rows.push({
      sequence: index + 3,
      amount,
      dueDate:
        preview[index + 1]?.dueDate ??
        preview[preview.length - 1]?.dueDate ??
        new Date().toISOString(),
      label: `Mensualité ${index + 2}`,
    })
  })

  return rows
}

/**
 * Montant à régler maintenant (acompte ou 1re mensualité ECH).
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
