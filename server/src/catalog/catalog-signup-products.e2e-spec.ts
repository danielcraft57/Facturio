import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { activatePendingUser, authenticatedRequest } from '../common/test-helpers/auth.helper';
import {
	buildRandomProductPayload,
	seedCatalogProductsForE2e,
} from '../common/test-helpers/catalog-products.helper';

const SIGNUP_TECH_IDS = ['react', 'typescript', 'nestjs', 'nodejs', 'javascript'];
const RANDOM_PRODUCT_COUNT = 3;

describe('Onboarding installation + produits (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
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
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await prisma.clientCatalogItem.deleteMany({});
		await prisma.organizationCatalogItem.deleteMany({});
		await prisma.refund.deleteMany({});
		await prisma.payment.deleteMany({});
		await prisma.invoiceLine.deleteMany({});
		await prisma.invoice.deleteMany({});
		await prisma.quoteLine.deleteMany({});
		await prisma.quote.deleteMany({});
		await prisma.subscription.deleteMany({});
		await prisma.plan.deleteMany({});
		await prisma.product.deleteMany({ where: { organizationId: { not: null } } });
		await prisma.user.deleteMany({});
		await prisma.organization.deleteMany({});

		await seedCatalogProductsForE2e(prisma);
	});

	it('inscription sans stack → assistant /installation → produits clonés modifiables', async () => {
		const email = `onboard-${Date.now()}@example.com`;
		const password = 'password123';

		await request(app.getHttpServer())
			.post('/api/auth/signup')
			.send({
				email,
				password,
				organizationName: `Studio ${Date.now()}`,
				acceptTerms: true,
				acceptPrivacy: true,
			})
			.expect(201);

		await activatePendingUser(prisma, email);

		const loginRes = await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ email, password })
			.expect(201);

		const cookies = loginRes.headers['set-cookie'] as string[] | string;
		const cookieList = Array.isArray(cookies) ? cookies : [cookies];

		const statusBefore = await authenticatedRequest(app, cookieList)
			.get('/api/onboarding/status')
			.expect(200);
		expect(statusBefore.body.completed).toBe(false);

		const preview = await authenticatedRequest(app, cookieList)
			.post('/api/onboarding/preview')
			.send({ technologyIds: SIGNUP_TECH_IDS })
			.expect(201);
		expect(preview.body.products.length).toBeGreaterThan(0);

		const install = await authenticatedRequest(app, cookieList)
			.post('/api/onboarding/install')
			.send({ technologyIds: SIGNUP_TECH_IDS })
			.expect(201);
		expect(install.body.clonedCount).toBeGreaterThan(0);

		const statusAfter = await authenticatedRequest(app, cookieList)
			.get('/api/onboarding/status')
			.expect(200);
		expect(statusAfter.body.completed).toBe(true);
		expect(statusAfter.body.productCount).toBe(install.body.clonedCount);

		const orgProducts = await authenticatedRequest(app, cookieList)
			.get('/api/products')
			.query({ pageSize: 50 })
			.expect(200);
		expect(orgProducts.body.total).toBeGreaterThanOrEqual(install.body.clonedCount);

		const firstOrgProduct = orgProducts.body.items[0];
		const newPrice = 199;
		await authenticatedRequest(app, cookieList)
			.patch(`/api/products/${firstOrgProduct.id}`)
			.send({ unitPrice: newPrice })
			.expect(200)
			.expect((res: { body: { unitPrice: string | number } }) => {
				expect(Number(res.body.unitPrice)).toBe(newPrice);
			});

		for (let i = 0; i < RANDOM_PRODUCT_COUNT; i++) {
			const payload = buildRandomProductPayload(i);
			await authenticatedRequest(app, cookieList)
				.post('/api/products')
				.send(payload)
				.expect(201);
		}

		const all = await authenticatedRequest(app, cookieList)
			.get('/api/products')
			.query({ pageSize: 100 })
			.expect(200);
		expect(all.body.total).toBeGreaterThanOrEqual(install.body.clonedCount + RANDOM_PRODUCT_COUNT);
	});

	it('rejette install avec moins de 2 technologies', async () => {
		const email = `onboard-fail-${Date.now()}@example.com`;
		await request(app.getHttpServer())
			.post('/api/auth/signup')
			.send({
				email,
				password: 'password123',
				organizationName: 'Org',
				acceptTerms: true,
				acceptPrivacy: true,
			})
			.expect(201);
		await activatePendingUser(prisma, email);
		const loginRes = await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ email, password: 'password123' })
			.expect(201);
		const cookies = loginRes.headers['set-cookie'] as string[] | string;
		const cookieList = Array.isArray(cookies) ? cookies : [cookies];

		await authenticatedRequest(app, cookieList)
			.post('/api/onboarding/install')
			.send({ technologyIds: ['react'] })
			.expect(400);
	});
});
