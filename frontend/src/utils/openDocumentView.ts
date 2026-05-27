/** Ouvre la fiche facture dans un nouvel onglet (route dédiée, hors liste dossiers). */
export function openInvoiceView(invoiceId: string): void {
  const path = `/factures/voir/${encodeURIComponent(invoiceId)}`
  window.open(path, '_blank', 'noopener,noreferrer')
}

/** Ouvre la fiche devis dans un nouvel onglet. */
export function openQuoteView(quoteId: string): void {
  const path = `/devis/voir/${encodeURIComponent(quoteId)}`
  window.open(path, '_blank', 'noopener,noreferrer')
}
