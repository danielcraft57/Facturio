import { validate } from 'class-validator';
import { CreateCreditNoteDto } from './create-credit-note.dto';
import { CreateCreditNoteLineDto } from './create-credit-note-line.dto';

describe('CreateCreditNoteDto', () => {
	it('devrait valider un avoir valide', async () => {
		const dto = new CreateCreditNoteDto();
		dto.clientId = 1;
		dto.lines = [
			{
				description: 'Remboursement',
				quantity: 1,
				unitPrice: 100,
				taxRate: 0.2
			}
		];

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait rejeter un avoir sans clientId', async () => {
		const dto = new CreateCreditNoteDto();
		dto.lines = [
			{
				description: 'Test',
				quantity: 1,
				unitPrice: 100
			}
		];

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].property).toBe('clientId');
	});

	it('devrait rejeter un avoir sans lignes', async () => {
		const dto = new CreateCreditNoteDto();
		dto.clientId = 1;
		dto.lines = [];

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
	});

	it('devrait accepter un statut valide', async () => {
		const dto = new CreateCreditNoteDto();
		dto.clientId = 1;
		dto.status = 'DRAFT';
		dto.lines = [
			{
				description: 'Test',
				quantity: 1,
				unitPrice: 100
			}
		];

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});
});

describe('CreateCreditNoteLineDto', () => {
	it('devrait valider une ligne valide', async () => {
		const dto = new CreateCreditNoteLineDto();
		dto.description = 'Remboursement';
		dto.quantity = 1;
		dto.unitPrice = 100;
		dto.taxRate = 0.2;

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait rejeter une ligne sans description', async () => {
		const dto = new CreateCreditNoteLineDto();
		dto.quantity = 1;
		dto.unitPrice = 100;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].property).toBe('description');
	});

	it('devrait rejeter une quantité invalide', async () => {
		const dto = new CreateCreditNoteLineDto();
		dto.description = 'Test';
		dto.quantity = 0;
		dto.unitPrice = 100;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
	});

	it('devrait rejeter un prix unitaire négatif', async () => {
		const dto = new CreateCreditNoteLineDto();
		dto.description = 'Test';
		dto.quantity = 1;
		dto.unitPrice = -10;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
	});
});

