export type ClientLike = {
  id: string
  name: string
  email?: string
}

export function isClientEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Nom affiché pour la création rapide (jamais l’email entier). */
export function guessClientNameFromQuery(query: string): string {
  const raw = query.trim()
  if (!raw) return ''
  if (!isClientEmail(raw)) return raw

  const local = raw.split('@')[0] ?? ''
  const pretty = local
    .replace(/[._+-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
  return pretty || 'Client'
}

/** Recherche stricte : pas de match partiel trop large (ex. « po » → mauvais client). */
export function findClientByQuery(query: string, clients: ClientLike[]): ClientLike | undefined {
  const raw = query.trim()
  const norm = raw.toLowerCase()
  if (!norm) return undefined

  const byEmail = clients.find((c) => c.email?.trim().toLowerCase() === norm)
  if (byEmail) return byEmail

  const byName = clients.find((c) => c.name.trim().toLowerCase() === norm)
  if (byName) return byName

  const dashParts = raw.split('—').map((s) => s.trim())
  if (dashParts.length >= 2) {
    const namePart = dashParts[0].toLowerCase()
    const emailPart = dashParts[1].toLowerCase()
    const byPair = clients.find(
      (c) =>
        c.name.trim().toLowerCase() === namePart &&
        (c.email?.trim().toLowerCase() ?? '') === emailPart,
    )
    if (byPair) return byPair
  }

  if (norm.length < 2) return undefined

  const prefixMatches = clients.filter((c) => {
    const name = c.name.trim().toLowerCase()
    const email = c.email?.trim().toLowerCase() ?? ''
    return name.startsWith(norm) || (email.length > 0 && email.startsWith(norm))
  })
  if (prefixMatches.length === 1) return prefixMatches[0]
  return undefined
}

export function clientQueryDraft(
  query: string,
  clients: ClientLike[],
): {
  matched: ClientLike | undefined
  willCreate: boolean
  suggestedName: string
  suggestedEmail: string
} {
  const raw = query.trim()
  if (!raw) {
    return { matched: undefined, willCreate: false, suggestedName: '', suggestedEmail: '' }
  }

  const matched = findClientByQuery(raw, clients)
  if (matched) {
    return {
      matched,
      willCreate: false,
      suggestedName: '',
      suggestedEmail: matched.email?.trim() ?? '',
    }
  }

  const looksLikeEmail = isClientEmail(raw)
  return {
    matched: undefined,
    willCreate: true,
    suggestedName: guessClientNameFromQuery(raw),
    suggestedEmail: looksLikeEmail ? raw.toLowerCase() : '',
  }
}
