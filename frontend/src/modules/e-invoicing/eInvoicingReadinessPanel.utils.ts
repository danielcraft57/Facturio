import type { OrganizationReadiness } from '../../services/eInvoicing'

/**
 * Indique si le panneau conformité doit être masqué sur le tableau de bord.
 * Vrai lorsque le profil émetteur est complet (nom, SIRET, adresse, etc.).
 */
export function shouldHideDashboardReadinessPanel(params: {
  compact?: boolean
  invoiceId?: number
  org: OrganizationReadiness | null
}): boolean {
  return Boolean(params.compact && !params.invoiceId && params.org?.ready)
}
