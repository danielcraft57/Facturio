import { validate } from 'class-validator';
import { ListQueryDto } from './list-query.dto';

describe('ListQueryDto', () => {
	it('devrait valider un DTO avec valeurs par défaut', async () => {
		const dto = new ListQueryDto();

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
		expect(dto.page).toBe(1);
		expect(dto.pageSize).toBe(20);
		expect(dto.order).toBe('desc');
	});

	it('devrait valider une pagination personnalisée', async () => {
		const dto = new ListQueryDto();
		dto.page = 2;
		dto.pageSize = 50;

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
		expect(dto.page).toBe(2);
		expect(dto.pageSize).toBe(50);
	});

	it('devrait rejeter une page négative', async () => {
		const dto = new ListQueryDto();
		dto.page = -1;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
	});

	it('devrait rejeter un pageSize trop grand', async () => {
		const dto = new ListQueryDto();
		dto.pageSize = 150;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
	});

	it('devrait rejeter un order invalide', async () => {
		const dto = new ListQueryDto();
		(dto as any).order = 'invalid';

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
	});

	it('devrait accepter search et sortBy', async () => {
		const dto = new ListQueryDto();
		dto.search = 'test';
		dto.sortBy = 'name';
		dto.order = 'asc';

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});
});

