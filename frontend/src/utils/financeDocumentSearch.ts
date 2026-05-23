/**
 * Recherche multi-mots pour dossiers factures/devis :
 * « fac 20€ payé » → tous les tokens doivent matcher (n°, client, statut, montant).
 * Tolérance légère aux fautes (Levenshtein) et aux accents.
 */

export type SearchableDocument = {
  searchText: string
  amount?: number
}

export type FinanceSearchOptionBase = {
  id: string
  label: string
  sublabel?: string
  href?: string
  searchText: string
  amount?: number
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.,€]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenizeSearchQuery(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

/** Extrait un montant depuis un token (20, 20€, 20,50). */
export function parseAmountFromToken(token: string): number | null {
  const cleaned = token.replace(/\s/g, '').replace(/€/gi, '')
  const m = cleaned.match(/^(\d+)(?:[,.](\d{1,2}))?$/)
  if (!m) return null
  const decimals = m[2] ?? '0'
  return Number(`${m[1]}.${decimals}`)
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const next = Math.min(row[j] + 1, prev + 1, row[j - 1] + cost)
      row[j - 1] = prev
      prev = next
    }
    row[b.length] = prev
  }
  return row[b.length]
}

function maxEditDistance(token: string): number {
  const len = token.length
  if (len <= 2) return 0
  if (len <= 4) return 1
  return 2
}

/** Correspondance floue token ↔ champ (mot ou sous-chaîne). */
export function fuzzyTokenMatchesField(token: string, field: string): boolean {
  const t = normalizeSearchText(token)
  const f = normalizeSearchText(field)
  if (!t) return true
  if (!f) return false
  if (f.includes(t)) return true

  const words = f.split(/\s+/).filter(Boolean)
  for (const word of words) {
    if (word.includes(t) || t.includes(word)) return true
    if (t.length >= 3 && word.length >= 3) {
      if (levenshtein(t, word) <= maxEditDistance(t)) return true
    }
  }

  if (t.length >= 4 && f.length >= 4 && levenshtein(t, f) <= maxEditDistance(t)) {
    return true
  }

  return false
}

function amountTokenMatches(token: string, amount: number): boolean {
  const parsed = parseAmountFromToken(token)
  if (parsed == null) return false
  if (Math.abs(amount - parsed) < 0.02) return true
  const rounded = Math.round(amount)
  const parsedRounded = Math.round(parsed)
  if (rounded === parsedRounded) return true
  // "20" peut viser 20,00 € affiché
  if (Math.floor(amount) === Math.floor(parsed)) return true
  return false
}

function tokenMatchesDocument(token: string, doc: SearchableDocument): boolean {
  const amt = parseAmountFromToken(token)
  if (amt != null && doc.amount != null && amountTokenMatches(token, doc.amount)) {
    return true
  }
  return fuzzyTokenMatchesField(token, doc.searchText)
}

/** Tous les tokens doivent matcher (ET logique). */
export function matchesDocumentSearch(
  doc: SearchableDocument,
  query: string,
): boolean {
  const tokens = tokenizeSearchQuery(query)
  if (tokens.length === 0) return true
  return tokens.every((token) => tokenMatchesDocument(token, doc))
}

export function scoreDocumentSearch(doc: SearchableDocument, query: string): number {
  const tokens = tokenizeSearchQuery(query)
  if (tokens.length === 0) return 0

  let score = 0
  const hay = normalizeSearchText(doc.searchText)

  for (const raw of tokens) {
    const token = normalizeSearchText(raw)
    if (!token) continue

    if (doc.amount != null && amountTokenMatches(raw, doc.amount)) {
      score += 12
      continue
    }

    if (hay.includes(token)) {
      score += 8
      continue
    }

    if (fuzzyTokenMatchesField(raw, doc.searchText)) {
      score += 4
      continue
    }

    return -1
  }

  return score
}

export function filterFinanceSearchOptions<T extends FinanceSearchOptionBase>(
  options: T[],
  query: string,
  limit = 10,
): T[] {
  const q = query.trim()
  if (!q) return options.slice(0, limit)

  return options
    .map((opt) => ({
      opt,
      score: scoreDocumentSearch(
        { searchText: opt.searchText, amount: opt.amount },
        q,
      ),
    }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.opt)
}

export function filterItemsByDocumentSearch<T>(
  items: T[],
  query: string,
  toSearchable: (item: T) => SearchableDocument,
): T[] {
  const q = query.trim()
  if (!q) return items
  return items.filter((item) => matchesDocumentSearch(toSearchable(item), q))
}

const INVOICE_STATUS_SYNONYMS: Record<string, string[]> = {
  paid: ['paye', 'payé', 'payee', 'regle', 'réglé', 'soldé', 'solde'],
  sent: ['envoye', 'envoyé', 'envoyee', 'emis', 'émis', 'facture envoyee'],
  overdue: ['retard', 'en retard', 'impaye', 'impayé'],
  draft: ['brouillon', 'draft'],
  cancelled: ['annule', 'annulé', 'annulee'],
}

export function buildInvoiceSearchEntry(
  inv: {
    id: string
    number: string
    status: string
    total: number
    client: { name: string }
  },
  statusLabel: string,
): { option: FinanceSearchOptionBase; searchable: SearchableDocument } {
  const synonyms = INVOICE_STATUS_SYNONYMS[inv.status] ?? []
  const amountStr = String(inv.total)
  const searchText = [
    inv.number,
    'facture',
    'fac',
    inv.client.name,
    inv.status,
    statusLabel,
    ...synonyms,
    amountStr,
    amountStr.replace('.', ','),
  ].join(' ')

  const option: FinanceSearchOptionBase = {
    id: inv.id,
    label: inv.number,
    sublabel: `${inv.client.name} · ${statusLabel} · ${formatAmountFr(inv.total)}`,
    href: `/factures/${inv.id}`,
    searchText,
    amount: inv.total,
  }

  return { option, searchable: { searchText, amount: inv.total } }
}

const QUOTE_STATUS_SYNONYMS: Record<string, string[]> = {
  DRAFT: ['brouillon', 'draft'],
  SENT: ['envoye', 'envoyé', 'envoyee', 'emis', 'émis'],
  ACCEPTED: ['accepte', 'accepté', 'acceptee', 'valide', 'validé'],
  REJECTED: ['rejete', 'rejeté', 'rejetee', 'refuse', 'refusé'],
  EXPIRED: ['expire', 'expiré', 'expirée', 'perime', 'périmé'],
}

export function buildQuoteSearchEntry(
  quote: {
    id: string
    number: string
    status: string
    total: number
    client?: { name: string } | null
    clientId: string
  },
  statusLabel: string,
): { option: FinanceSearchOptionBase; searchable: SearchableDocument } {
  const clientName = quote.client?.name ?? `Client #${quote.clientId}`
  const synonyms = QUOTE_STATUS_SYNONYMS[quote.status] ?? []
  const amountStr = String(quote.total)
  const searchText = [
    quote.number,
    'devis',
    'dev',
    clientName,
    quote.status,
    statusLabel,
    ...synonyms,
    amountStr,
    amountStr.replace('.', ','),
  ].join(' ')

  const option: FinanceSearchOptionBase = {
    id: String(quote.id),
    label: quote.number,
    sublabel: `${clientName} · ${statusLabel} · ${formatAmountFr(quote.total)}`,
    searchText,
    amount: quote.total,
  }

  return { option, searchable: { searchText, amount: quote.total } }
}

const CLIENT_STATUS_SYNONYMS: Record<string, string[]> = {
  active: ['actif', 'active'],
  inactive: ['inactif', 'inactive', 'archive'],
  prospect: ['prospect', 'lead', 'piste'],
}

export function buildClientSearchEntry(
  client: {
    id: string
    name: string
    email: string
    phone?: string
    siren?: string
    status: string
    company?: { name: string }
  },
  statusLabel: string,
): { option: FinanceSearchOptionBase; searchable: SearchableDocument } {
  const synonyms = CLIENT_STATUS_SYNONYMS[client.status] ?? []
  const company = client.company?.name ?? ''
  const searchText = [
    client.name,
    company,
    client.email,
    client.phone ?? '',
    client.siren ?? '',
    client.status,
    statusLabel,
    ...synonyms,
    'client',
    'entreprise',
    'societe',
    'société',
  ]
    .filter(Boolean)
    .join(' ')

  const option: FinanceSearchOptionBase = {
    id: client.id,
    label: client.name,
    sublabel: `${client.email} · ${statusLabel}${company ? ` · ${company}` : ''}`,
    href: `/clients/${client.id}`,
    searchText,
  }

  return { option, searchable: { searchText } }
}

function formatAmountFr(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Surligne chaque token trouvé dans le texte. */
export function highlightSearchTokens(
  text: string,
  query: string,
): Array<string | { highlight: string }> {
  const tokens = tokenizeSearchQuery(query).map(normalizeSearchText).filter((t) => t.length >= 2)
  if (tokens.length === 0) return [text]

  type Part = { text: string; highlight: boolean }
  let parts: Part[] = [{ text, highlight: false }]

  for (const token of tokens) {
    const next: Part[] = []
    for (const part of parts) {
      if (part.highlight) {
        next.push(part)
        continue
      }
      const lower = normalizeSearchText(part.text)
      const idx = lower.indexOf(token)
      if (idx < 0) {
        next.push(part)
        continue
      }
      if (idx > 0) next.push({ text: part.text.slice(0, idx), highlight: false })
      next.push({
        text: part.text.slice(idx, idx + token.length),
        highlight: true,
      })
      if (idx + token.length < part.text.length) {
        next.push({ text: part.text.slice(idx + token.length), highlight: false })
      }
    }
    parts = next
  }

  const out: Array<string | { highlight: string }> = []
  for (const p of parts) {
    if (p.highlight) out.push({ highlight: p.text })
    else if (p.text) out.push(p.text)
  }
  return out
}
