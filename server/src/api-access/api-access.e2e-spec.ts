import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest, TestUser } from '../common/test-helpers/auth.helper';

function uniqueEmail(local: string): string {
	return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

describe('API publique (api-access)', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: TestUser;
	let apiToken: string;

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
		testUser = await createTestUser(app, prisma);
		await prisma.organization.update({
			where: { id: testUser.organizationId },
			data: { saasPlan: 'PRO' },
		});

		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/api-access/tokens')
			.send({
				name: 'E2E token',
				permissions: [
					'clients.read',
					'clients.write',
					'produits.read',
					'produits.write',
					'factures.read',
					'factures.write',
					'factures.send',
					'devis.read',
					'devis.write',
				],
			})
			.expect(201)
			.then((r: { body: { token: string } }) => r.body);

		apiToken = created.token;
		expect(apiToken).toMatch(/^fact_/);
	});

	afterAll(async () => {
		await app.close();
	});

	const bearer = () => ({ Authorization: `Bearer ${apiToken}` });

	it('GET /api/public sans jeton → 401', async () => {
		await request(app.getHttpServer()).get('/api/public/clients').expect(401);
	});

	it('GET /api/public avec jeton → liste clients', async () => {
		await request(app.getHttpServer())
			.get('/api/public/clients')
			.set(bearer())
			.expect(200);
	});

	it('crée une facture payée externe avec nouvel email (fiche client auto)', async () => {
		const email = uniqueEmail('api-new-client');

		const invoice = await request(app.getHttpServer())
			.post('/api/public/factures')
			.set(bearer())
			.send({
				clientEmail: email,
				clientName: 'Client API Auto',
				paidExternally: true,
				externalPaymentMethod: 'Boutique test',
				lines: [{ description: 'Commande API', quantity: 1, unitPrice: 99, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: number; status: string; balance: unknown } }) => r.body);

		expect(invoice.status).toBe('PAID');
		expect(Number(invoice.balance)).toBe(0);

		const client = await prisma.client.findUnique({ where: { email } });
		expect(client).toBeTruthy();
		expect(client?.organizationId).toBe(testUser.organizationId);

		const sendRes = await request(app.getHttpServer())
			.post(`/api/public/factures/${invoice.id}/send`)
			.set(bearer())
			.send({ email, updateClientEmail: true })
			.expect(201)
			.then((r: { body: { emailSent: boolean; alreadyPaid: boolean } }) => r.body);

		expect(sendRes.emailSent).toBe(true);
		expect(sendRes.alreadyPaid).toBe(true);
	});

	it('crée un produit rattaché à l’organisation du jeton', async () => {
		const sku = `E2E-API-${Date.now()}`;
		const product = await request(app.getHttpServer())
			.post('/api/public/produits')
			.set(bearer())
			.send({
				name: 'Produit API e2e',
				sku,
				kind: 'SERVICE',
				unitPrice: 42,
			})
			.expect(201)
			.then((r: { body: { id: number; organizationId: number | null } }) => r.body);

		expect(product.organizationId).toBe(testUser.organizationId);

		const row = await prisma.product.findUnique({ where: { id: product.id } });
		expect(row?.organizationId).toBe(testUser.organizationId);
		expect(row?.visualType).toBeTruthy();
		expect(['icon', 'library']).toContain(row?.visualType);
		if (row?.visualType === 'icon') {
			expect(row.iconName).toBeTruthy();
			expect(row?.imageData).toMatch(/^icon-gradient:/);
		}
		if (row?.visualType === 'library') {
			expect(row?.imageData).toMatch(/^library:/);
		}
	});

	it('crée un produit icône explicite avec dégradé', async () => {
		const product = await request(app.getHttpServer())
			.post('/api/public/produits')
			.set(bearer())
			.send({
				name: 'Produit icône fixe',
				sku: `E2E-ICON-${Date.now()}`,
				kind: 'SERVICE',
				visualType: 'icon',
				iconName: 'robot',
			})
			.expect(201)
			.then((r: { body: { iconName: string; imageData: string } }) => r.body);

		expect(product.iconName).toBe('robot');
		expect(product.imageData).toMatch(/^icon-gradient:/);
	});

	it('crée un produit bibliothèque explicite', async () => {
		const product = await request(app.getHttpServer())
			.post('/api/public/produits')
			.set(bearer())
			.send({
				name: 'Produit bibliothèque',
				sku: `E2E-LIB-${Date.now()}`,
				visualType: 'library',
				imageData: 'library:seo',
			})
			.expect(201)
			.then((r: { body: { visualType: string; imageData: string } }) => r.body);

		expect(product.visualType).toBe('library');
		expect(product.imageData).toBe('library:seo');
	});

	it('crée un devis avec productSku (get-or-create) puis réutilise le SKU', async () => {
		const email = uniqueEmail('devis-sku');
		const client = await request(app.getHttpServer())
			.post('/api/public/clients')
			.set(bearer())
			.send({ name: 'Client devis SKU', email, countryCode: 'FR' })
			.expect(201)
			.then((r: { body: { id: string } }) => r.body);

		const sku = `E2E-DEVIS-SKU-${Date.now()}`;

		const quote1 = await request(app.getHttpServer())
			.post('/api/public/devis')
			.set(bearer())
			.send({
				clientId: client.id,
				lines: [
					{
						productSku: sku,
						description: 'Ligne get-or-create e2e',
						quantity: 1,
						unitPrice: 500,
						taxRate: 0.2,
					},
				],
			})
			.expect(201)
			.then((r: { body: { id: string; lines: Array<{ productId: number; unitPrice: number }> } }) => r.body);

		expect(quote1.lines[0]?.productId).toBeTruthy();
		const productId = quote1.lines[0]!.productId;

		const productRow = await prisma.product.findUnique({ where: { id: productId } });
		expect(productRow?.sku).toBe(sku);
		expect(productRow?.organizationId).toBe(testUser.organizationId);

		const quote2 = await request(app.getHttpServer())
			.post('/api/public/devis')
			.set(bearer())
			.send({
				clientId: client.id,
				lines: [{ productSku: sku, quantity: 1, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { lines: Array<{ productId: number; unitPrice: number }> } }) => r.body);

		expect(quote2.lines[0]?.productId).toBe(productId);
		expect(Number(quote2.lines[0]?.unitPrice)).toBe(500);
	});

	it('scope manquant → 403', async () => {
		const limited = await authenticatedRequest(app, testUser.cookies)
			.post('/api/api-access/tokens')
			.send({ name: 'Limited', permissions: ['clients.read'] })
			.expect(201)
			.then((r: { body: { token: string } }) => r.body);

		await request(app.getHttpServer())
			.post('/api/public/factures')
			.set({ Authorization: `Bearer ${limited.token}` })
			.send({
				clientEmail: uniqueEmail('no-write'),
				lines: [{ description: 'X', quantity: 1, unitPrice: 10 }],
			})
			.expect(403);
	});
});
