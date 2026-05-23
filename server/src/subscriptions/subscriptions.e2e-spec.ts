import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { BillingInterval, SubscriptionStatus } from '@prisma/client';
import { createTestUser, authenticatedRequest, type TestUser } from '../common/test-helpers/auth.helper';

function uniqueEmail(base: string): string {
	const [local, domain] = base.split('@');
	return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@${domain}`;
}

describe('Subscriptions e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: TestUser;
	let clientId: string;
	let productId: number;
	let planId: number;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
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

		await prisma.subscription.deleteMany();
		await prisma.plan.deleteMany();
		await prisma.product.deleteMany();

		const client = await prisma.client.create({
			data: {
				name: 'Client Abonnement',
				email: uniqueEmail('sub-client@test.com'),
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		});
		clientId = client.id;

		const product = await prisma.product.create({
			data: {
				name: 'Produit Abonnement',
				description: 'Produit test abonnement',
				unitPrice: 1000,
			},
		});
		productId = product.id;

		const plan = await prisma.plan.create({
			data: {
				productId,
				name: 'Plan mensuel test',
				amount: 199,
				currency: 'EUR',
				interval: BillingInterval.MONTH,
			},
		});
		planId = plan.id;
	});

	afterAll(async () => {
		await app.close();
	});

	it('plans CRUD', async () => {
		const list = await authenticatedRequest(app, testUser.cookies)
			.get('/api/subscriptions/plans')
			.expect(200)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(Array.isArray(list)).toBe(true);
		expect(list.length).toBeGreaterThanOrEqual(1);

		const createdPlan = await authenticatedRequest(app, testUser.cookies)
			.post('/api/subscriptions/plans')
			.send({
				productId,
				name: 'Plan annuel test',
				amount: 1990,
				currency: 'EUR',
				interval: BillingInterval.YEAR,
			})
			.expect(201)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(createdPlan.id).toBeDefined();
		expect(createdPlan.name).toBe('Plan annuel test');

		const retrieved = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/subscriptions/plans/${createdPlan.id}`)
			.expect(200)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(retrieved.id).toBe(createdPlan.id);

		const updated = await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/subscriptions/plans/${createdPlan.id}`)
			.send({ name: 'Plan annuel modifie' })
			.expect(200)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(updated.name).toBe('Plan annuel modifie');

		await authenticatedRequest(app, testUser.cookies)
			.delete(`/api/subscriptions/plans/${createdPlan.id}`)
			.expect(200);

		await authenticatedRequest(app, testUser.cookies)
			.get(`/api/subscriptions/plans/${createdPlan.id}`)
			.expect(404);
	});

	it('subscriptions lifecycle', async () => {
		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/subscriptions')
			.send({
				clientId,
				planId,
				quantity: 3,
			})
			.expect(201)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(created.id).toBeDefined();
		expect(created.clientId).toBe(clientId);
		expect(created.planId).toBe(planId);
		expect(created.quantity).toBe(3);

		const subscriptionId = created.id;

		const list = await authenticatedRequest(app, testUser.cookies)
			.get('/api/subscriptions')
			.expect(200)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(Array.isArray(list)).toBe(true);
		expect(list.length).toBeGreaterThanOrEqual(1);

		const retrieved = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/subscriptions/${subscriptionId}`)
			.expect(200)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(retrieved.id).toBe(subscriptionId);

		const updated = await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/subscriptions/${subscriptionId}`)
			.send({ quantity: 5 })
			.expect(200)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(updated.quantity).toBe(5);

		const cancelAtEnd = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/subscriptions/${subscriptionId}/cancel-at-period-end`)
			.expect(201)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(cancelAtEnd.cancelAtPeriodEnd).toBe(true);

		const cancelNow = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/subscriptions/${subscriptionId}/cancel-now`)
			.expect(201)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(cancelNow.status).toBe(SubscriptionStatus.CANCELED);
		expect(cancelNow.canceledAt).toBeDefined();
	});

	it('returns 404 for unknown subscription', async () => {
		await authenticatedRequest(app, testUser.cookies).get('/api/subscriptions/999999').expect(404);
	});
});
