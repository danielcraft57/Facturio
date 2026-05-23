import { ENTITY_ID_LENGTH, ENTITY_ID_REGEX, generateEntityId, isEntityId } from './entity-id'

describe('entity-id', () => {
	it('generateEntityId produit 10 caractères alphanumériques', () => {
		const id = generateEntityId()
		expect(id).toHaveLength(ENTITY_ID_LENGTH)
		expect(id).toMatch(ENTITY_ID_REGEX)
	})

	it('isEntityId rejette les anciens cuid', () => {
		expect(isEntityId('c00000000000000000000000')).toBe(false)
		expect(isEntityId('0000000000')).toBe(true)
	})
})
