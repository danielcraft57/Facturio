import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';

describe('Products e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: { cookies: string[]; organizationId: number };

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
		app = moduleRef.createNestApplication();
		app.setGlobalPrefix('api');
		app.use(cookieParser());
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				transform: true,
				forbidUnknownValues: false
			})
		);
		await app.init();
		prisma = app.get(PrismaService);

		// Créer un utilisateur de test
		testUser = await createTestUser(app, prisma);
		await prisma.organization.update({
			where: { id: testUser.organizationId },
			data: { onboardingCompletedAt: new Date() },
		});
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		// Nettoyer la base avant chaque test (ordre important : supprimer d'abord les entités dépendantes)
		await prisma.subscription.deleteMany({});
		await prisma.plan.deleteMany({});
		await prisma.product.deleteMany({ where: { organizationId: testUser.organizationId } });
	});

	describe('POST /products', () => {
		it('devrait créer un produit valide', () => {
			return authenticatedRequest(app, testUser.cookies)
				.post('/api/products')
				.send({
					name: 'Test Product',
					sku: 'TEST-001',
					unitPrice: 100
				})
				.expect(201)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('id');
					expect(res.body.name).toBe('Test Product');
					expect(res.body.sku).toBe('TEST-001');
					expect(Number(res.body.unitPrice)).toBe(100);
				});
		});

		it('devrait rejeter un produit sans nom', () => {
			return authenticatedRequest(app, testUser.cookies)
				.post('/api/products')
				.send({
					sku: 'TEST-001',
					unitPrice: 100
				})
				.expect(400)
				.expect((res: any) => {
					expect(res.body.statusCode).toBe(400);
					expect(res.body.message || res.body.errors).toBeDefined();
				});
		});

		it('devrait rejeter un prix négatif', () => {
			return authenticatedRequest(app, testUser.cookies)
				.post('/api/products')
				.send({
					name: 'Test Product',
					unitPrice: -10
				})
				.expect(400);
		});
	});

	describe('GET /products', () => {
		beforeEach(async () => {
			// Créer des produits de test
			await prisma.product.createMany({
				data: [
					{ name: 'Product 1', sku: 'TST-P1', unitPrice: 100, organizationId: testUser.organizationId },
					{ name: 'Product 2', sku: 'TST-P2', unitPrice: 200, organizationId: testUser.organizationId },
					{ name: 'Product 3', sku: 'TST-P3', unitPrice: 300, organizationId: testUser.organizationId },
					{ name: 'Test Product', sku: 'TST-SRCH', unitPrice: 150, organizationId: testUser.organizationId },
				],
			});
		});

		it('devrait retourner tous les produits avec pagination', () => {
			return authenticatedRequest(app, testUser.cookies)
				.get('/api/products')
				.query({ page: 1, pageSize: 2 })
				.expect(200)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('items');
					expect(res.body).toHaveProperty('total');
					expect(res.body).toHaveProperty('page');
					expect(res.body).toHaveProperty('pageSize');
					expect(res.body.items).toHaveLength(2);
					expect(res.body.total).toBe(4);
					expect(res.body.page).toBe(1);
					expect(res.body.pageSize).toBe(2);
				});
		});

		it('devrait rechercher par nom ou SKU', () => {
			return authenticatedRequest(app, testUser.cookies)
				.get('/api/products')
				.query({ search: 'Test' })
				.expect(200)
				.expect((res: any) => {
					expect(res.body.items.length).toBeGreaterThan(0);
					expect(res.body.items.some((p: any) => p.name.includes('Test') || p.sku.includes('Test'))).toBe(true);
				});
		});

		it('devrait trier par nom ascendant', () => {
			return authenticatedRequest(app, testUser.cookies)
				.get('/api/products')
				.query({ sortBy: 'name', order: 'asc' })
				.expect(200)
				.expect((res: any) => {
					const names = res.body.items.map((p: any) => p.name);
					const sorted = [...names].sort();
					expect(names).toEqual(sorted);
				});
		});

		it('devrait utiliser les valeurs par défaut si aucun paramètre', () => {
			return authenticatedRequest(app, testUser.cookies)
				.get('/api/products')
				.expect(200)
				.expect((res: any) => {
					expect(res.body.page).toBe(1);
					expect(res.body.pageSize).toBe(20);
				});
		});
	});

	describe('GET /products/:id', () => {
		it('devrait retourner un produit existant', async () => {
			const product = await prisma.product.create({
				data: { name: 'Test Product', unitPrice: 100, organizationId: testUser.organizationId },
			});

			return authenticatedRequest(app, testUser.cookies)
				.get(`/api/products/${product.id}`)
				.expect(200)
				.expect((res: any) => {
					expect(res.body.id).toBe(product.id);
					expect(res.body.name).toBe('Test Product');
				});
		});

		it('devrait retourner 404 pour un produit inexistant', () => {
			return authenticatedRequest(app, testUser.cookies)
				.get('/api/products/99999')
				.expect(404);
		});
	});

	describe('PATCH /products/:id', () => {
		it('devrait mettre à jour un produit', async () => {
			const product = await prisma.product.create({
				data: { name: 'Old Name', unitPrice: 100, organizationId: testUser.organizationId },
			});

			return authenticatedRequest(app, testUser.cookies)
				.patch(`/api/products/${product.id}`)
				.send({ name: 'New Name' })
				.expect(200)
				.expect((res: any) => {
					expect(res.body.name).toBe('New Name');
				});
		});
	});

	describe('DELETE /products/:id', () => {
		it('devrait supprimer un produit', async () => {
			const product = await prisma.product.create({
				data: { name: 'To Delete', unitPrice: 100, organizationId: testUser.organizationId },
			});

			return authenticatedRequest(app, testUser.cookies)
				.delete(`/api/products/${product.id}`)
				.expect(200)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('success', true);
				});
		});
	});
});
