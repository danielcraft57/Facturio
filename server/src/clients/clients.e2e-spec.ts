import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Clients e2e', () => {
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
		await prisma.$executeRawUnsafe('DELETE FROM Client');
	});

	afterAll(async () => {
		await app.close();
	});

	// ========================================
	// TESTS UNITAIRES - CRUD BASIQUE
	// ========================================

	it('create -> list -> get -> update -> delete', async () => {
		// CREATE
		const created = await request(app.getHttpServer())
			.post('/clients')
			.send({ name: 'Test Client', email: 'test@example.com', isCompany: true, countryCode: 'FR' })
			.expect(201)
			.then(r => r.body);

		expect(created.id).toBeDefined();
		expect(created.name).toBe('Test Client');

		// LIST
		const list = await request(app.getHttpServer()).get('/clients').expect(200).then(r => r.body);
		expect(list.items).toHaveLength(1);
		expect(list.items[0].name).toBe('Test Client');

		// GET
		const retrieved = await request(app.getHttpServer()).get(`/clients/${created.id}`).expect(200).then(r => r.body);
		expect(retrieved.name).toBe('Test Client');

		// UPDATE
		const updated = await request(app.getHttpServer())
			.patch(`/clients/${created.id}`)
			.send({ name: 'Updated Client' })
			.expect(200)
			.then(r => r.body);

		expect(updated.name).toBe('Updated Client');

		// DELETE
		await request(app.getHttpServer()).delete(`/clients/${created.id}`).expect(200);

		const finalList = await request(app.getHttpServer()).get('/clients').expect(200).then(r => r.body);
		expect(finalList.items).toHaveLength(0);
	});

	// ========================================
	// TESTS D'INTÉGRATION - VALIDATION
	// ========================================

	it('validation errors', async () => {
		// Email invalide
		await request(app.getHttpServer())
			.post('/clients')
			.send({ name: 'Test', email: 'invalid-email', isCompany: true })
			.expect(400);

		// Nom manquant
		await request(app.getHttpServer())
			.post('/clients')
			.send({ email: 'test@example.com', isCompany: true })
			.expect(400);
	});

	// ========================================
	// TESTS DE PERFORMANCE - LISTE PAGINÉE
	// ========================================

	it('pagination and filtering', async () => {
		// Créer plusieurs clients
		const clients = [];
		for (let i = 0; i < 5; i++) {
			const client = await request(app.getHttpServer())
				.post('/clients')
				.send({ name: `Client ${i}`, email: `client${i}@test.com`, isCompany: true, countryCode: 'FR' })
				.expect(201)
				.then(r => r.body);
			clients.push(client);
		}

		// Test pagination
		const page1 = await request(app.getHttpServer()).get('/clients?page=1&pageSize=2').expect(200).then(r => r.body);
		expect(page1.items).toHaveLength(2);

		const page2 = await request(app.getHttpServer()).get('/clients?page=2&pageSize=2').expect(200).then(r => r.body);
		expect(page2.items).toHaveLength(2);

		// Test recherche
		const search = await request(app.getHttpServer()).get('/clients?search=Client 1').expect(200).then(r => r.body);
		expect(search.items).toHaveLength(1);
		expect(search.items[0].name).toBe('Client 1');
	});
});
