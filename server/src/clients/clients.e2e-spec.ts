import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestUser, authenticatedRequest, TestUser } from '../common/test-helpers/auth.helper';
import { expectEntityId } from '../common/test-helpers/entity-id.helper';

function uniqueEmail(base: string): string {
	const [local, domain] = base.split('@');
	return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@${domain}`;
}

describe('Clients e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: TestUser;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
		app = moduleRef.createNestApplication();
		app.use(cookieParser());
		app.setGlobalPrefix('api');
		await app.init();
		prisma = app.get(PrismaService);
		// On remet à zéro les entités liées aux clients (devis/factures) sans
		// supprimer les clients globaux pour préserver les FK des autres tests.
		await prisma.$executeRawUnsafe('DELETE FROM JournalLine');
		await prisma.$executeRawUnsafe('DELETE FROM JournalEntry');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteView');
		await prisma.$executeRawUnsafe('DELETE FROM EmailEvent');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteLine');
		await prisma.$executeRawUnsafe('DELETE FROM Quote');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirApplication');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirLine');
		await prisma.$executeRawUnsafe('DELETE FROM Avoir');
		await prisma.$executeRawUnsafe('DELETE FROM Refund');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
		
		// Créer un utilisateur de test
		testUser = await createTestUser(app, prisma);
	});

	afterAll(async () => {
		await app.close();
	});

	// ========================================
	// TESTS UNITAIRES - CRUD BASIQUE
	// ========================================

	it('create -> list -> get -> update -> archive (DELETE)', async () => {
		// CREATE avec un email unique pour éviter les collisions entre runs
		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/clients')
			.send({ name: 'Test Client', email: uniqueEmail('test@example.com'), isCompany: true, countryCode: 'FR' })
			.expect(201)
			.then((r: any) => r.body);

		expectEntityId(created.id);
		expect(created.name).toBe('Test Client');

		// LIST - la base peut contenir d'autres clients, on vérifie que celui qu'on
		// vient de créer est bien présent dans la liste.
		const list = await authenticatedRequest(app, testUser.cookies)
			.get('/api/clients')
			.expect(200)
			.then((r: any) => r.body);
		const found = list.items.find((c: any) => c.id === created.id);
		expect(found).toBeDefined();
		expect(found.name).toBe('Test Client');

		// GET
		const retrieved = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/clients/${created.id}`)
			.expect(200)
			.then((r: any) => r.body);
		expect(retrieved.name).toBe('Test Client');

		// UPDATE
		const updated = await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/clients/${created.id}`)
			.send({ name: 'Updated Client' })
			.expect(200)
			.then((r: any) => r.body);

		expect(updated.name).toBe('Updated Client');

		// DELETE archive (plus de suppression physique)
		await authenticatedRequest(app, testUser.cookies)
			.delete(`/api/clients/${created.id}`)
			.expect(200);

		const finalList = await authenticatedRequest(app, testUser.cookies)
			.get('/api/clients')
			.expect(200)
			.then((r: any) => r.body);
		const archived = finalList.items.find((c: any) => c.id === created.id);
		expect(archived).toBeUndefined();

		const stillThere = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/clients/${created.id}`)
			.expect(200)
			.then((r: any) => r.body);
		expect(stillThere.archivedAt).toBeTruthy();
	});

	// ========================================
	// TESTS D'INTÉGRATION - VALIDATION
	// ========================================

	it('validation errors', async () => {
		// Email invalide
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/clients')
			.send({ name: 'Test', email: 'invalid-email', isCompany: true })
			.expect(400);

		// Nom manquant
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/clients')
			.send({ email: 'test@example.com', isCompany: true })
			.expect(400);
	});

	// ========================================
	// TESTS DE PERFORMANCE - LISTE PAGINÉE
	// ========================================

	it('pagination and filtering', async () => {
		// Créer plusieurs clients avec des emails uniques
		const clients: any[] = [];
		const suffix = Date.now();
		for (let i = 0; i < 5; i++) {
			const client = await authenticatedRequest(app, testUser.cookies)
				.post('/api/clients')
				.send({
					name: `Client ${i}`,
					email: `client${i}+${suffix}@test.com`,
					isCompany: true,
					countryCode: 'FR'
				})
				.expect(201)
				.then((r: any) => r.body);
			clients.push(client);
		}

		// Test pagination
		const page1 = await authenticatedRequest(app, testUser.cookies)
			.get('/api/clients?page=1&pageSize=2')
			.expect(200)
			.then((r: any) => r.body);
		expect(page1.items).toHaveLength(2);

		const page2 = await authenticatedRequest(app, testUser.cookies)
			.get('/api/clients?page=2&pageSize=2')
			.expect(200)
			.then((r: any) => r.body);
		expect(page2.items).toHaveLength(2);

		// Test recherche - on vérifie qu'au moins un des clients créés est présent
		const search = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/clients?search=Client 1`)
			.expect(200)
			.then((r: any) => r.body);
		const found = search.items.find((c: any) => c.id === clients[1].id);
		expect(found).toBeDefined();
		expect(found.name).toBe('Client 1');
	});
});
