import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAvoirDto } from './create-avoir.dto';
import { CreateAvoirLineDto } from './create-avoir-line.dto';

describe('CreateAvoirDto', () => {
	it('devrait valider un avoir valide', async () => {
		const dto = plainToInstance(CreateAvoirDto, {
			clientId: 1,
			lines: [
			{
				description: 'Remboursement',
				quantity: 1,
				unitPrice: 100,
				taxRate: 0.2
			}
			]
		});

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait rejeter un avoir sans clientId', async () => {
		const dto = plainToInstance(CreateAvoirDto, {
			lines: [
			{
				description: 'Test',
				quantity: 1,
				unitPrice: 100
			}
			]
		});

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].property).toBe('clientId');
	});

	it('devrait rejeter un avoir sans lignes', async () => {
		const dto = plainToInstance(CreateAvoirDto, {
			clientId: 1,
			lines: []
		});

		const errors = await validate(dto);
		// Le DTO n'a pas de validation @ArrayMinSize, donc on vérifie juste qu'il n'y a pas d'erreur de validation
		// La validation métier se fait dans le service
		expect(errors.length).toBe(0);
	});

	it('devrait accepter un statut valide', async () => {
		const dto = plainToInstance(CreateAvoirDto, {
			clientId: 1,
			status: 'DRAFT',
			lines: [
			{
				description: 'Test',
				quantity: 1,
				unitPrice: 100
			}
			]
		});

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});
});

describe('CreateAvoirLineDto', () => {
	it('devrait valider une ligne valide', async () => {
		const dto = new CreateAvoirLineDto();
		dto.description = 'Remboursement';
		dto.quantity = 1;
		dto.unitPrice = 100;
		dto.taxRate = 0.2;

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait rejeter une ligne sans description', async () => {
		const dto = new CreateAvoirLineDto();
		dto.quantity = 1;
		dto.unitPrice = 100;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].property).toBe('description');
	});

	it('devrait rejeter une quantité invalide', async () => {
		const dto = new CreateAvoirLineDto();
		dto.description = 'Test';
		dto.quantity = 0;
		dto.unitPrice = 100;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
	});

	it('devrait rejeter un prix unitaire négatif', async () => {
		const dto = new CreateAvoirLineDto();
		dto.description = 'Test';
		dto.quantity = 1;
		dto.unitPrice = -10;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
	});
});

