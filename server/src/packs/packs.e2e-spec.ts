import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';

describe('Packs e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testProductId: number;
	let testUser: { cookies: string[]; organizationId: number };

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule]
		}).compile();

		app = moduleRef.createNestApplication();
		app.setGlobalPrefix('api');
		app.use(cookieParser());
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				transform: true,
				forbidUnknownValues: false,
			}),
		);
		await app.init();

		prisma = app.get(PrismaService);

		// Créer un utilisateur de test
		testUser = await createTestUser(app, prisma);

		// Nettoyage des packs de test
		await prisma.pack.deleteMany();

		// Créer un produit de test pour les packs
		const product = await prisma.product.create({
			data: {
				name: 'Test Product',
				sku: `TEST-PROD-${Date.now()}`,
				unitPrice: 100,
				kind: 'SERVICE'
			}
		});
		testProductId = product.id;
	});

	afterAll(async () => {
		// Nettoyage
		if (prisma) {
		await prisma.pack.deleteMany();
			if (testProductId) {
		await prisma.product.delete({ where: { id: testProductId } });
			}
		}
		if (app) {
		await app.close();
		}
	});

	it('create -> list -> get -> update -> delete', async () => {
		// CREATE
		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/packs')
			.send({
				name: 'Pack Test',
				type: 'WEBSITE',
				description: 'Description du pack test',
				details: 'Détails du pack test',
				products: [String(testProductId)],
				features: ['Feature 1', 'Feature 2'],
				deliveryTime: 30
			})
			.expect(201)
			.then((r: any) => r.body);

		expect(created.id).toBeDefined();
		expect(created.name).toBe('Pack Test');
		expect(created.type).toBe('WEBSITE');
		expect(Array.isArray(created.products)).toBe(true);
		expect(created.products.length).toBe(1);
		expect(Array.isArray(created.features)).toBe(true);
		expect(created.features.length).toBe(2);
		expect(created.deliveryTime).toBe(30);

		// LIST
		const list = await authenticatedRequest(app, testUser.cookies)
			.get('/api/packs')
			.expect(200)
			.then((r: any) => r.body);

		expect(list.packs).toBeDefined();
		expect(Array.isArray(list.packs)).toBe(true);
		expect(list.total).toBeGreaterThanOrEqual(1);
		const found = list.packs.find((p: any) => p.id === created.id);
		expect(found).toBeDefined();

		// GET
		const retrieved = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/packs/${created.id}`)
			.expect(200)
			.then((r: any) => r.body);

		expect(retrieved.id).toBe(created.id);
		expect(retrieved.name).toBe('Pack Test');

		// UPDATE
		const updated = await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/packs/${created.id}`)
			.send({
				name: 'Pack Modifié',
				deliveryTime: 45
			})
			.expect(200)
			.then((r: any) => r.body);

		expect(updated.name).toBe('Pack Modifié');
		expect(updated.deliveryTime).toBe(45);

		// DELETE
		await authenticatedRequest(app, testUser.cookies).delete(`/api/packs/${created.id}`).expect(200);

		// Vérifier qu'il n'existe plus
		await authenticatedRequest(app, testUser.cookies).get(`/api/packs/${created.id}`).expect(404);
	});

	it('should support search', async () => {
		// Créer un pack avec un nom unique
		const uniqueName = `SearchPack-${Date.now()}`;
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/packs')
			.send({
				name: uniqueName,
				type: 'SAAS',
				description: 'Description',
				details: 'Détails',
				products: [String(testProductId)]
			})
			.expect(201);

		// Rechercher
		const results = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/packs?search=${uniqueName}`)
			.expect(200)
			.then((r: any) => r.body);

		expect(results.packs.length).toBeGreaterThanOrEqual(1);
		expect(results.packs.some((p: any) => p.name.includes(uniqueName))).toBe(true);
	});

	it('returns 404 for unknown pack', async () => {
		await authenticatedRequest(app, testUser.cookies).get('/api/packs/999999').expect(404);
	});
});

