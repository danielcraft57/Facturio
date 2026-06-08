import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';

function toDto(data: Partial<CreateProductDto>): CreateProductDto {
	return plainToInstance(CreateProductDto, data);
}

describe('CreateProductDto', () => {
	it('devrait valider un DTO valide', async () => {
		const dto = toDto({
			name: 'Test Product',
			sku: 'TEST-001',
			unitPrice: 100,
		});

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
		expect(dto.sku).toBe('TEST-001');
	});

	it('devrait rejeter un nom vide', async () => {
		const dto = toDto({ name: '', sku: 'TEST-001' });

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].property).toBe('name');
	});

	it('devrait rejeter un prix négatif', async () => {
		const dto = toDto({
			name: 'Test Product',
			sku: 'TEST-001',
			unitPrice: -10,
		});

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		const priceError = errors.find(e => e.property === 'unitPrice');
		expect(priceError).toBeDefined();
	});

	it('devrait exiger un SKU au format PREFIX-NOM', async () => {
		const dto = toDto({ name: 'Test Product' });

		const errors = await validate(dto);
		expect(errors.some(e => e.property === 'sku')).toBe(true);
	});

	it('devrait normaliser le SKU en majuscules', async () => {
		const dto = toDto({
			name: 'Test Product',
			sku: 'stack-wp-vitrine',
		});

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
		expect(dto.sku).toBe('STACK-WP-VITRINE');
	});

	it('devrait rejeter un SKU sans tiret', async () => {
		const dto = toDto({
			name: 'Test Product',
			sku: 'DEVONLY',
		});

		const errors = await validate(dto);
		expect(errors.some(e => e.property === 'sku')).toBe(true);
	});
});
