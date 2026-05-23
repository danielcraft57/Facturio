/** Identifiant public court (client, facture, devis) — 10 caractères [0-9a-z]. */
export const ENTITY_ID_LENGTH = 10

export const ENTITY_ID_REGEX = new RegExp(`^[0-9a-z]{${ENTITY_ID_LENGTH}}$`, 'i')

/** @deprecated Utiliser ENTITY_ID_REGEX */
export const ENTITY_CUID_REGEX = ENTITY_ID_REGEX

export function isEntityId(value: unknown): value is string {
  return typeof value === 'string' && ENTITY_ID_REGEX.test(value)
}

/** @deprecated Utiliser isEntityId */
export function isEntityCuid(value: unknown): value is string {
  return isEntityId(value)
}
