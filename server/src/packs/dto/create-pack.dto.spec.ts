import { validate } from 'class-validator';
import { CreatePackDto } from './create-pack.dto';

describe('CreatePackDto', () => {
	it('devrait valider un DTO valide', async () => {
		const dto = new CreatePackDto();
		dto.name = 'Pack Test';
		dto.type = 'BASIC';
		dto.description = 'Description du pack';
		dto.details = 'Détails du pack';
		dto.products = ['1', '2'];

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait rejeter un pack sans name', async () => {
		const dto = new CreatePackDto();
		dto.type = 'BASIC';
		dto.description = 'Description';
		dto.details = 'Détails';
		dto.products = ['1'];

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors.some(e => e.property === 'name')).toBe(true);
	});

	it('devrait rejeter un pack sans products', async () => {
		const dto = new CreatePackDto();
		dto.name = 'Pack Test';
		dto.type = 'BASIC';
		dto.description = 'Description';
		dto.details = 'Détails';

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors.some(e => e.property === 'products')).toBe(true);
	});

	it('devrait accepter un deliveryTime valide', async () => {
		const dto = new CreatePackDto();
		dto.name = 'Pack Test';
		dto.type = 'BASIC';
		dto.description = 'Description';
		dto.details = 'Détails';
		dto.products = ['1'];
		dto.deliveryTime = 30;

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait rejeter un deliveryTime négatif', async () => {
		const dto = new CreatePackDto();
		dto.name = 'Pack Test';
		dto.type = 'BASIC';
		dto.description = 'Description';
		dto.details = 'Détails';
		dto.products = ['1'];
		dto.deliveryTime = -5;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		const deliveryTimeError = errors.find(e => e.property === 'deliveryTime');
		expect(deliveryTimeError).toBeDefined();
	});

	it('devrait accepter des features optionnelles', async () => {
		const dto = new CreatePackDto();
		dto.name = 'Pack Test';
		dto.type = 'BASIC';
		dto.description = 'Description';
		dto.details = 'Détails';
		dto.products = ['1'];
		dto.features = ['Feature 1', 'Feature 2'];

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});
});

