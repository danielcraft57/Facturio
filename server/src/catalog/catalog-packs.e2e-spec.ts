import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { createTestUser } from '../common/test-helpers/auth.helper';
import { seedCatalogProductsForE2e } from '../common/test-helpers/catalog-products.helper';
import { PrismaService } from '../prisma/prisma.service';
import { listCatalogPacks } from './catalog-packs';

describe('Catalog packs e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let token: string;
	let organizationId: number;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
		app = moduleRef.createNestApplication();
		app.setGlobalPrefix('api');
		app.use(cookieParser());
		app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
		await app.init();
		prisma = app.get(PrismaService);
		await seedCatalogProductsForE2e(prisma);
		for (const pack of listCatalogPacks()) {
			for (const sku of pack.skus) {
				const existing = await prisma.product.findFirst({
					where: { sku, organizationId: null },
				});
				if (!existing) {
					await prisma.product.create({
						data: {
							sku,
							name: sku,
							organizationId: null,
							unitPrice: 100,
							kind: 'SERVICE',
							category: 'DEV',
						},
					});
				}
			}
		}
		const auth = await createTestUser(app, prisma, {
			email: `packs-${Date.now()}@test.local`,
			organizationName: 'Pack Test Org',
		});
		token = auth.token;
		organizationId = auth.organizationId;
	});

	afterAll(async () => {
		await app.close();
	});

	it('GET /catalog/packs liste les packs (public)', async () => {
		const res = await request(app.getHttpServer()).get('/api/catalog/packs').expect(200);
		expect(res.body.packs?.length).toBeGreaterThanOrEqual(3);
		expect(res.body.packs.some((p: { id: string }) => p.id === 'agence-web')).toBe(true);
	});

	it('POST /catalog/packs/:id/install clone les prestations', async () => {
		const before = await prisma.product.count({ where: { organizationId } });
		const res = await request(app.getHttpServer())
			.post('/api/catalog/packs/agence-web/install')
			.set('Authorization', `Bearer ${token}`)
			.expect(201);
		expect(res.body.clonedCount).toBeGreaterThan(0);
		const after = await prisma.product.count({ where: { organizationId } });
		expect(after).toBeGreaterThan(before);

		const again = await request(app.getHttpServer())
			.post('/api/catalog/packs/agence-web/install')
			.set('Authorization', `Bearer ${token}`)
			.expect(201);
		expect(again.body.skippedCount).toBeGreaterThan(0);
		expect(again.body.clonedCount).toBe(0);
	});
});
