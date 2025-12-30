import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

describe('CreateProductDto', () => {
	it('devrait valider un DTO valide', async () => {
		const dto = new CreateProductDto();
		dto.name = 'Test Product';
		dto.sku = 'TEST-001';
		dto.unitPrice = 100;

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait rejeter un nom vide', async () => {
		const dto = new CreateProductDto();
		dto.name = '';

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].property).toBe('name');
	});

	it('devrait rejeter un prix négatif', async () => {
		const dto = new CreateProductDto();
		dto.name = 'Test Product';
		dto.unitPrice = -10;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		const priceError = errors.find(e => e.property === 'unitPrice');
		expect(priceError).toBeDefined();
	});

	it('devrait accepter des champs optionnels null', async () => {
		const dto = new CreateProductDto();
		dto.name = 'Test Product';
		dto.sku = null;
		dto.unitPrice = null;

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait accepter un produit sans SKU ni prix', async () => {
		const dto = new CreateProductDto();
		dto.name = 'Test Product';

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});
});

