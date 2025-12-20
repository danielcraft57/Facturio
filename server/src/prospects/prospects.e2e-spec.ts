import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Prospects e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule]
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();

		prisma = app.get(PrismaService);

		// Nettoyage des prospects de test
		await prisma.prospect.deleteMany();
	});

	afterAll(async () => {
		await app.close();
	});

	it('create -> list -> get -> update -> delete', async () => {
		// CREATE
		const created = await request(app.getHttpServer())
			.post('/prospects')
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
			.then((r) => r.body);

		expect(created.id).toBeDefined();
		expect(created.companyName).toBe('Test Company');
		expect(created.industry).toBe('SaaS');
		expect(created.size).toBe('startup');
		expect(created.decisionMaker).toBeDefined();
		expect(created.decisionMaker.name).toBe('John Doe');

		// LIST
		const list = await request(app.getHttpServer())
			.get('/prospects')
			.expect(200)
			.then((r) => r.body);

		expect(list.data).toBeDefined();
		expect(Array.isArray(list.data)).toBe(true);
		expect(list.total).toBeGreaterThanOrEqual(1);
		const found = list.data.find((p: any) => p.id === created.id);
		expect(found).toBeDefined();

		// GET
		const retrieved = await request(app.getHttpServer())
			.get(`/prospects/${created.id}`)
			.expect(200)
			.then((r) => r.body);

		expect(retrieved.id).toBe(created.id);
		expect(retrieved.companyName).toBe('Test Company');

		// UPDATE
		const updated = await request(app.getHttpServer())
			.patch(`/prospects/${created.id}`)
			.send({
				companyName: 'Updated Company',
				status: 'QUALIFIED',
				score: 85
			})
			.expect(200)
			.then((r) => r.body);

		expect(updated.companyName).toBe('Updated Company');
		expect(updated.status).toBe('qualified');
		expect(updated.score).toBe(85);

		// DELETE
		await request(app.getHttpServer()).delete(`/prospects/${created.id}`).expect(200);

		// Vérifier qu'il n'existe plus
		await request(app.getHttpServer()).get(`/prospects/${created.id}`).expect(404);
	});

	it('should return metrics', async () => {
		const metrics = await request(app.getHttpServer())
			.get('/prospects/metrics')
			.expect(200)
			.then((r) => r.body);

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
		await request(app.getHttpServer())
			.post('/prospects')
			.send({
				companyName: uniqueName,
				industry: 'Tech',
				size: 'SMALL',
				country: 'France'
			})
			.expect(201);

		// Rechercher
		const results = await request(app.getHttpServer())
			.get(`/prospects?search=${uniqueName}`)
			.expect(200)
			.then((r) => r.body);

		expect(results.data.length).toBeGreaterThanOrEqual(1);
		expect(results.data.some((p: any) => p.companyName.includes(uniqueName))).toBe(true);
	});

	it('returns 404 for unknown prospect', async () => {
		await request(app.getHttpServer()).get('/prospects/999999').expect(404);
	});
});

