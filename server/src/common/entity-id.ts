import { randomInt } from 'node:crypto'

/** Identifiant public court (client, facture, devis) — 10 caractères [0-9a-z]. */
export const ENTITY_ID_LENGTH = 10
const ENTITY_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

export const ENTITY_ID_REGEX = new RegExp(`^[0-9a-z]{${ENTITY_ID_LENGTH}}$`, 'i')

/** @deprecated Utiliser ENTITY_ID_REGEX */
export const ENTITY_CUID_REGEX = ENTITY_ID_REGEX

export function generateEntityId(): string {
	let id = ''
	for (let i = 0; i < ENTITY_ID_LENGTH; i++) {
		id += ENTITY_ID_ALPHABET[randomInt(ENTITY_ID_ALPHABET.length)]
	}
	return id
}

/** Ajoute un id public pour Prisma create/upsert (Client, Invoice, Quote). */
export function withEntityId<T extends Record<string, unknown>>(data: T): T & { id: string } {
	return { ...data, id: generateEntityId() }
}

export function isEntityId(value: unknown): value is string {
	return typeof value === 'string' && ENTITY_ID_REGEX.test(value)
}

/** @deprecated Utiliser isEntityId */
export function isEntityCuid(value: unknown): value is string {
	return isEntityId(value)
}
