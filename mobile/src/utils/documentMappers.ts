import type { Invoice } from '../types/invoice'
import type { Quote } from '../types/quote'

function pickIsoDate(raw: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = raw[key]
    if (value != null && String(value).trim()) return String(value)
  }
  return new Date().toISOString()
}

function normalizeClient(raw: Record<string, unknown>) {
  const client = (raw.client as Record<string, unknown> | undefined) ?? {}
  return {
    id: String(client.id ?? raw.clientId ?? ''),
    name: String(client.name ?? client.companyName ?? 'Client'),
    email: client.email ? String(client.email) : undefined,
  }
}

/** Aligne la réponse API Prisma (`date`) sur le modèle mobile (`issueDate`). */
export function normalizeInvoiceFromApi(raw: Record<string, unknown>): Invoice {
  return {
    id: String(raw.id ?? ''),
    number: String(raw.number ?? ''),
    clientId: String(raw.clientId ?? ''),
    client: normalizeClient(raw),
    status: String(raw.status ?? 'DRAFT').toLowerCase() as Invoice['status'],
    issueDate: pickIsoDate(raw, ['date', 'issueDate', 'createdAt']),
    dueDate: raw.dueDate ? String(raw.dueDate) : undefined,
    total: Number(raw.total ?? 0),
    currency: String(raw.currency ?? 'EUR'),
    seenAt: raw.seenAt != null ? String(raw.seenAt) : null,
  }
}

export function normalizeQuoteFromApi(raw: Record<string, unknown>): Quote {
  return {
    id: String(raw.id ?? ''),
    number: String(raw.number ?? ''),
    clientId: String(raw.clientId ?? ''),
    client: normalizeClient(raw),
    status: String(raw.status ?? 'DRAFT').toLowerCase() as Quote['status'],
    issueDate: pickIsoDate(raw, ['date', 'issueDate', 'createdAt']),
    dueDate: raw.expiryDate ? String(raw.expiryDate) : raw.dueDate ? String(raw.dueDate) : undefined,
    total: Number(raw.total ?? 0),
    currency: String(raw.currency ?? 'EUR'),
    seenAt: raw.seenAt != null ? String(raw.seenAt) : null,
  }
}
