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

/** Ouvre la fiche client dans un nouvel onglet. */
export function openClientView(clientId: string): void {
  const path = `/clients/${encodeURIComponent(clientId)}`
  window.open(path, '_blank', 'noopener,noreferrer')
}

/** Ouvre la liste factures avec le dialogue de création pré-rempli pour ce client. */
export function openCreateInvoiceForClient(clientId: string): void {
  const q = new URLSearchParams({ create: '1', clientId })
  window.open(`/factures/inbox?${q.toString()}`, '_blank', 'noopener,noreferrer')
}

/** Ouvre la liste devis avec le dialogue de création pré-rempli pour ce client. */
export function openCreateQuoteForClient(clientId: string): void {
  const q = new URLSearchParams({ create: '1', clientId })
  window.open(`/devis/inbox?${q.toString()}`, '_blank', 'noopener,noreferrer')
}
