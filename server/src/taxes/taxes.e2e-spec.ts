import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestUser, authenticatedRequest, type TestUser } from '../../src/common/test-helpers/auth.helper';

describe('Taxes e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: TestUser;

	beforeAll(async () => {
		process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client-id';
		process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret';
		process.env.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';

		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
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

		await prisma.$executeRawUnsafe('DELETE FROM QuoteView');
		await prisma.$executeRawUnsafe('DELETE FROM EmailEvent');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteLine');
		await prisma.$executeRawUnsafe('DELETE FROM Quote');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirApplication');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirLine');
		await prisma.$executeRawUnsafe('DELETE FROM Avoir');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
	});

	afterAll(async () => {
		await app.close();
	});

	it('create -> list -> update -> delete', async () => {
		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/taxes')
			.send({ name: 'TVA Standard', rate: 0.2, isDefault: true })
			.expect(201)
			.then((r: { body: { id: number; name: string; rate: number } }) => r.body);

		expect(created.id).toBeDefined();
		expect(created.name).toBe('TVA Standard');
		expect(Number(created.rate)).toBe(0.2);

		const list = await authenticatedRequest(app, testUser.cookies)
			.get('/api/taxes')
			.expect(200)
			.then((r: { body: Array<{ id: number; name: string }> }) => r.body);
		const found = list.find((t: { id: number }) => t.id === created.id);
		expect(found).toBeDefined();
		expect(found?.name).toBe('TVA Standard');

		const updated = await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/taxes/${created.id}`)
			.send({ rate: 0.21 })
			.expect(200)
			.then((r: { body: { rate: number } }) => r.body);

		expect(Number(updated.rate)).toBe(0.21);

		await authenticatedRequest(app, testUser.cookies).delete(`/api/taxes/${created.id}`).expect(200);

		const finalList = await authenticatedRequest(app, testUser.cookies)
			.get('/api/taxes')
			.expect(200)
			.then((r: { body: Array<{ id: number }> }) => r.body);
		const deleted = finalList.find((t: { id: number }) => t.id === created.id);
		expect(deleted).toBeUndefined();
	});

	it('VAT policies by country', async () => {
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/taxes')
			.send({ name: 'TVA France', rate: 0.2, isDefault: true })
			.expect(201);

		await authenticatedRequest(app, testUser.cookies)
			.post('/api/taxes')
			.send({ name: 'TVA Allemagne', rate: 0.19, isDefault: false })
			.expect(201);

		await authenticatedRequest(app, testUser.cookies)
			.post('/api/taxes')
			.send({ name: 'TVA Zéro', rate: 0, isDefault: false })
			.expect(201);

		const defaultRates = await authenticatedRequest(app, testUser.cookies)
			.get('/api/taxes?isDefault=true')
			.expect(200)
			.then((r: { body: Array<{ rate: number }> }) => r.body);
		expect(defaultRates.length).toBeGreaterThan(0);
		expect(defaultRates.some((t: { rate: number }) => Number(t.rate) === 0.2)).toBe(true);
	});

	it('validation errors', async () => {
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/taxes')
			.send({ name: 'Invalid Tax', rate: -0.1 })
			.expect(400);

		await authenticatedRequest(app, testUser.cookies)
			.post('/api/taxes')
			.send({ name: 'Invalid Tax', rate: 1.5 })
			.expect(400);

		await authenticatedRequest(app, testUser.cookies)
			.post('/api/taxes')
			.send({ rate: 0.2 })
			.expect(400);
	});

	it('search and filtering', async () => {
		for (let i = 0; i < 5; i++) {
			await authenticatedRequest(app, testUser.cookies)
				.post('/api/taxes')
				.send({ name: `Tax ${i}`, rate: 0.1 + i * 0.05, isDefault: false })
				.expect(201);
		}

		const search = await authenticatedRequest(app, testUser.cookies)
			.get('/api/taxes?search=Tax 1')
			.expect(200)
			.then((r: { body: Array<{ name: string }> }) => r.body);
		expect(search.length).toBeGreaterThan(0);
		expect(search.some((t: { name: string }) => t.name === 'Tax 1')).toBe(true);

		const defaultOnly = await authenticatedRequest(app, testUser.cookies)
			.get('/api/taxes?isDefault=true')
			.expect(200)
			.then((r: { body: Array<{ isDefault: boolean }> }) => r.body);
		expect(defaultOnly.length).toBeGreaterThan(0);
		expect(defaultOnly.every((t: { isDefault: boolean }) => t.isDefault === true)).toBe(true);
	});
});
