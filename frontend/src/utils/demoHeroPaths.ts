import { invoiceService } from '../services/invoices'

/** Chemin de repli si aucune facture exemple n'est disponible. */
export const DEMO_HERO_INBOX_FALLBACK = '/factures/inbox'

/**
 * Indique si l'utilisateur est sur le détail d'une facture démo.
 *
 * @param pathname - Chemin courant React Router
 */
export function isDemoInvoiceDetailPath(pathname: string): boolean {
  return /^\/factures\/voir\/\d+/.test(pathname)
}

/**
 * Résout l'URL de la facture héro (payée ou envoyée en priorité) pour l'entrée démo.
 *
 * @returns Chemin `/factures/voir/:id` ou inbox en repli
 */
export async function resolveDemoHeroInvoicePath(): Promise<string> {
  try {
    const list = await invoiceService.getInvoices({ page: 1, limit: 8, folder: 'inbox' })
    const sample =
      list.data?.invoices?.find((inv) => inv.status === 'paid' || inv.status === 'sent') ??
      list.data?.invoices?.[0]
    if (sample?.id) {
      return `/factures/voir/${sample.id}`
    }
  } catch {
    /* repli inbox */
  }
  return DEMO_HERO_INBOX_FALLBACK
}

/**
 * CTA principal de la popin welcome selon la page d'atterrissage démo.
 *
 * @param pathname - Chemin courant
 */
export function getDemoWelcomePrimaryCta(pathname: string): { label: string; path: string | null } {
  if (isDemoInvoiceDetailPath(pathname)) {
    return {
      label: 'Continuer : PDF et score conformité',
      path: null,
    }
  }
  return {
    label: 'Première victoire : voir une facture prête à envoyer',
    path: DEMO_HERO_INBOX_FALLBACK,
  }
}
