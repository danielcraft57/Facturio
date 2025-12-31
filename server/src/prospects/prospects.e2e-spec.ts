import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest, TestUser } from '../common/test-helpers/auth.helper';

describe('Prospects e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: TestUser;

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
		testUser = await createTestUser(app, prisma);

		// Nettoyage des prospects de test
		await prisma.prospect.deleteMany();
	});

	afterAll(async () => {
		await app.close();
	});

	it('create -> list -> get -> update -> delete', async () => {
		// CREATE
		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/prospects')
			.send({
				companyName: 'Test Company',
				industry: 'SaaS',
				size: 'STARTUP',
				country: 'France',
				email: `test-${Date.now()}@example.com`,
				decisionMaker: {
					name: 'John Doe',
					position: 'CEO',
					email: 'john@test.com'
				},
				source: 'DIRECT',
				score: 75,
				priority: 'HIGH'
			})
			.expect(201)
			.then((r: any) => r.body);

		expect(created.id).toBeDefined();
		expect(created.companyName).toBe('Test Company');
		expect(created.industry).toBe('SaaS');
		expect(created.size).toBe('startup');
		expect(created.decisionMaker).toBeDefined();
		expect(created.decisionMaker.name).toBe('John Doe');

		// LIST
		const list = await authenticatedRequest(app, testUser.cookies)
			.get('/api/prospects')
			.expect(200)
			.then((r: any) => r.body);

		expect(list.data).toBeDefined();
		expect(Array.isArray(list.data)).toBe(true);
		expect(list.total).toBeGreaterThanOrEqual(1);
		const found = list.data.find((p: any) => p.id === created.id);
		expect(found).toBeDefined();

		// GET
		const retrieved = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/prospects/${created.id}`)
			.expect(200)
			.then((r: any) => r.body);

		expect(retrieved.id).toBe(created.id);
		expect(retrieved.companyName).toBe('Test Company');

		// UPDATE
		const updated = await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/prospects/${created.id}`)
			.send({
				companyName: 'Updated Company',
				status: 'QUALIFIED',
				score: 85
			})
			.expect(200)
			.then((r: any) => r.body);

		expect(updated.companyName).toBe('Updated Company');
		expect(updated.status).toBe('qualified');
		expect(updated.score).toBe(85);

		// DELETE
		await authenticatedRequest(app, testUser.cookies).delete(`/api/prospects/${created.id}`).expect(200);

		// Vérifier qu'il n'existe plus
		await authenticatedRequest(app, testUser.cookies).get(`/api/prospects/${created.id}`).expect(404);
	});

	it('should return metrics', async () => {
		const metrics = await authenticatedRequest(app, testUser.cookies)
			.get('/api/prospects/metrics')
			.expect(200)
			.then((r: any) => r.body);

		expect(metrics).toBeDefined();
		expect(typeof metrics.total).toBe('number');
		expect(typeof metrics.byStatus).toBe('object');
		expect(typeof metrics.byIndustry).toBe('object');
		expect(typeof metrics.conversionRate).toBe('number');
		expect(typeof metrics.averageScore).toBe('number');
	});

	it('should support search', async () => {
		// Créer un prospect avec un nom unique
		const uniqueName = `SearchTest-${Date.now()}`;
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/prospects')
			.send({
				companyName: uniqueName,
				industry: 'Tech',
				size: 'SMALL',
				country: 'France'
			})
			.expect(201);

		// Rechercher
		const results = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/prospects?search=${uniqueName}`)
			.expect(200)
			.then((r: any) => r.body);

		expect(results.data.length).toBeGreaterThanOrEqual(1);
		expect(results.data.some((p: any) => p.companyName.includes(uniqueName))).toBe(true);
	});

	it('returns 404 for unknown prospect', async () => {
		await authenticatedRequest(app, testUser.cookies).get('/api/prospects/999999').expect(404);
	});
});

