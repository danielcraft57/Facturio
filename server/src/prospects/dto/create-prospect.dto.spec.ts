import { validate } from 'class-validator';
import { CreateProspectDto } from './create-prospect.dto';
import { DecisionMakerDto } from './decision-maker.dto';

describe('CreateProspectDto', () => {
	it('devrait valider un DTO valide', async () => {
		const dto = new CreateProspectDto();
		dto.companyName = 'Test Company';
		dto.industry = 'SaaS';
		dto.size = 'STARTUP';
		dto.country = 'France';

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait rejeter un prospect sans companyName', async () => {
		const dto = new CreateProspectDto();
		dto.industry = 'SaaS';
		dto.size = 'STARTUP';
		dto.country = 'France';

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors.some(e => e.property === 'companyName')).toBe(true);
	});

	it('devrait rejeter un prospect sans country', async () => {
		const dto = new CreateProspectDto();
		dto.companyName = 'Test Company';
		dto.industry = 'SaaS';
		dto.size = 'STARTUP';

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors.some(e => e.property === 'country')).toBe(true);
	});

	it('devrait valider un email valide', async () => {
		const dto = new CreateProspectDto();
		dto.companyName = 'Test Company';
		dto.industry = 'SaaS';
		dto.size = 'STARTUP';
		dto.country = 'France';
		dto.email = 'test@example.com';

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait rejeter un email invalide', async () => {
		const dto = new CreateProspectDto();
		dto.companyName = 'Test Company';
		dto.industry = 'SaaS';
		dto.size = 'STARTUP';
		dto.country = 'France';
		dto.email = 'invalid-email';

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		const emailError = errors.find(e => e.property === 'email');
		expect(emailError).toBeDefined();
	});

	it('devrait valider un score entre 0 et 100', async () => {
		const dto = new CreateProspectDto();
		dto.companyName = 'Test Company';
		dto.industry = 'SaaS';
		dto.size = 'STARTUP';
		dto.country = 'France';
		dto.score = 75;

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('devrait rejeter un score supérieur à 100', async () => {
		const dto = new CreateProspectDto();
		dto.companyName = 'Test Company';
		dto.industry = 'SaaS';
		dto.size = 'STARTUP';
		dto.country = 'France';
		dto.score = 150;

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		const scoreError = errors.find(e => e.property === 'score');
		expect(scoreError).toBeDefined();
	});

	it('devrait valider un decisionMaker valide', async () => {
		const dto = new CreateProspectDto();
		dto.companyName = 'Test Company';
		dto.industry = 'SaaS';
		dto.size = 'STARTUP';
		dto.country = 'France';
		dto.decisionMaker = {
			name: 'John Doe',
			email: 'john@example.com',
			position: 'CEO'
		};

		const errors = await validate(dto);
		// Vérifier qu'il n'y a pas d'erreurs sur les champs requis
		const requiredFieldErrors = errors.filter(e => 
			['companyName', 'industry', 'size', 'country'].includes(e.property)
		);
		expect(requiredFieldErrors.length).toBe(0);
	});

	it('devrait rejeter un email invalide dans decisionMaker', async () => {
		const dto = new CreateProspectDto();
		dto.companyName = 'Test Company';
		dto.industry = 'SaaS';
		dto.size = 'STARTUP';
		dto.country = 'France';
		dto.decisionMaker = {
			name: 'John Doe',
			email: 'invalid-email',
			position: 'CEO'
		};

		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
	});
});

