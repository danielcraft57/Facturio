import { ENTITY_ID_LENGTH, ENTITY_ID_REGEX } from '../entity-id'

/** ID valide mais inexistant (tests 404). */
export const UNKNOWN_ENTITY_ID = '0'.repeat(ENTITY_ID_LENGTH)

/** @deprecated Utiliser UNKNOWN_ENTITY_ID */
export const UNKNOWN_ENTITY_CUID = UNKNOWN_ENTITY_ID

export function expectEntityId(id: unknown): void {
	expect(id).toEqual(expect.stringMatching(ENTITY_ID_REGEX))
}

/** @deprecated Utiliser expectEntityId */
export const expectEntityCuid = expectEntityId
