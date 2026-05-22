import type { ArchiveRow } from '../../components/finance/ArchiveGroupedView'
import type { Invoice } from '../../services/invoices'
import type { Quote } from '../../types/quote'

const INVOICE_STATUS: Record<string, { label: string; color: ArchiveRow['statusColor'] }> = {
  draft: { label: 'Brouillon', color: 'default' },
  sent: { label: 'Envoyée', color: 'info' },
  paid: { label: 'Payée', color: 'success' },
  overdue: { label: 'En retard', color: 'warning' },
  cancelled: { label: 'Annulée', color: 'error' },
}

const QUOTE_STATUS: Record<string, { label: string; color: ArchiveRow['statusColor'] }> = {
  DRAFT: { label: 'Brouillon', color: 'default' },
  SENT: { label: 'Envoyé', color: 'info' },
  ACCEPTED: { label: 'Accepté', color: 'success' },
  REJECTED: { label: 'Refusé', color: 'error' },
  EXPIRED: { label: 'Expiré', color: 'warning' },
}

export function invoiceToArchiveRow(raw: Record<string, unknown>): ArchiveRow {
  const status = String(raw.status ?? 'draft').toLowerCase()
  const meta = INVOICE_STATUS[status] ?? { label: status, color: 'default' as const }
  const client = (raw.client as Record<string, unknown>) ?? {}
  return {
    id: raw.id as string | number,
    number: String(raw.number ?? ''),
    clientName: String(client.name ?? client.companyName ?? 'Client'),
    statusLabel: meta.label,
    statusColor: meta.color,
    date: String(raw.date ?? raw.issueDate ?? ''),
    total: Number(raw.total ?? 0),
    currency: String(raw.currency ?? 'EUR'),
    archivedAt: raw.archivedAt ? String(raw.archivedAt) : undefined,
  }
}

export function quoteToArchiveRow(quote: Quote): ArchiveRow {
  const meta = QUOTE_STATUS[quote.status] ?? { label: quote.status, color: 'default' as const }
  return {
    id: quote.id,
    number: quote.number,
    clientName: quote.client?.name ?? 'Client',
    statusLabel: meta.label,
    statusColor: meta.color,
    date: quote.date,
    total: Number(quote.total),
    currency: 'EUR',
    archivedAt: quote.archivedAt,
    publicToken: quote.publicToken,
  }
}

export function invoiceModelToArchiveRow(invoice: Invoice): ArchiveRow {
  return invoiceToArchiveRow(invoice as unknown as Record<string, unknown>)
}
