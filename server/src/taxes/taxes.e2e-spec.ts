import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Taxes e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
		app = moduleRef.createNestApplication();
		await app.init();
		prisma = app.get(PrismaService);
		await prisma.$executeRawUnsafe('DELETE FROM QuoteView');
		await prisma.$executeRawUnsafe('DELETE FROM EmailEvent');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteLine');
		await prisma.$executeRawUnsafe('DELETE FROM Quote');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
		await prisma.$executeRawUnsafe('DELETE FROM TaxRate');
		await prisma.$executeRawUnsafe('DELETE FROM Client');
	});

	afterAll(async () => {
		await app.close();
	});

	// ========================================
	// TESTS UNITAIRES - CRUD BASIQUE
	// ========================================

	it('create -> list -> update -> delete', async () => {
		// CREATE
		const created = await request(app.getHttpServer())
			.post('/taxes')
			.send({ name: 'TVA Standard', rate: 0.2, isDefault: true })
			.expect(201)
			.then(r => r.body);

		expect(created.id).toBeDefined();
		expect(created.name).toBe('TVA Standard');
		expect(Number(created.rate)).toBe(0.2);

		// LIST
		const list = await request(app.getHttpServer()).get('/taxes').expect(200).then(r => r.body);
		expect(list).toHaveLength(1);
		expect(list[0].name).toBe('TVA Standard');

		// UPDATE
		const updated = await request(app.getHttpServer())
			.patch(`/taxes/${created.id}`)
			.send({ rate: 0.21 })
			.expect(200)
			.then(r => r.body);

		expect(Number(updated.rate)).toBe(0.21);

		// DELETE
		await request(app.getHttpServer()).delete(`/taxes/${created.id}`).expect(200);

		const finalList = await request(app.getHttpServer()).get('/taxes').expect(200).then(r => r.body);
		expect(finalList).toHaveLength(0);
	});

	// ========================================
	// TESTS D'INTÉGRATION - POLITIQUES TVA
	// ========================================

	it('VAT policies by country', async () => {
		// Créer différents taux de TVA
		const tvaFR = await request(app.getHttpServer())
			.post('/taxes')
			.send({ name: 'TVA France', rate: 0.2, isDefault: true })
			.expect(201)
			.then(r => r.body);

		const tvaDE = await request(app.getHttpServer())
			.post('/taxes')
			.send({ name: 'TVA Allemagne', rate: 0.19, isDefault: false })
			.expect(201)
			.then(r => r.body);

		const tvaZero = await request(app.getHttpServer())
			.post('/taxes')
			.send({ name: 'TVA Zéro', rate: 0, isDefault: false })
			.expect(201)
			.then(r => r.body);

		// Vérifier les taux par défaut
		const defaultRates = await request(app.getHttpServer()).get('/taxes?isDefault=true').expect(200).then(r => r.body);
		expect(defaultRates).toHaveLength(1);
		expect(Number(defaultRates[0].rate)).toBe(0.2);
	});

	// ========================================
	// TESTS DE VALIDATION - ERREURS
	// ========================================

	it('validation errors', async () => {
		// Taux négatif
		await request(app.getHttpServer())
			.post('/taxes')
			.send({ name: 'Invalid Tax', rate: -0.1 })
			.expect(400);

		// Taux supérieur à 100%
		await request(app.getHttpServer())
			.post('/taxes')
			.send({ name: 'Invalid Tax', rate: 1.5 })
			.expect(400);

		// Nom manquant
		await request(app.getHttpServer())
			.post('/taxes')
			.send({ rate: 0.2 })
			.expect(400);
	});

	// ========================================
	// TESTS DE PERFORMANCE - RECHERCHE
	// ========================================

	it('search and filtering', async () => {
		// Créer plusieurs taxes
		const taxes = [];
		for (let i = 0; i < 5; i++) {
			const tax = await request(app.getHttpServer())
				.post('/taxes')
				.send({ name: `Tax ${i}`, rate: 0.1 + i * 0.05, isDefault: false })
				.expect(201)
				.then(r => r.body);
			taxes.push(tax);
		}

		// Test recherche par nom
		const search = await request(app.getHttpServer()).get('/taxes?search=Tax 1').expect(200).then(r => r.body);
		expect(search).toHaveLength(1);
		expect(search[0].name).toBe('Tax 1');

		// Test filtrage par défaut
		const defaultOnly = await request(app.getHttpServer()).get('/taxes?isDefault=true').expect(200).then(r => r.body);
		expect(defaultOnly.length).toBeGreaterThan(0);
		expect(defaultOnly.every((t: any) => t.isDefault === true)).toBe(true);
	});
});
