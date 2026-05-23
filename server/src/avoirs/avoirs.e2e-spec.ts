import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';

describe('Avoirs e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let clientId: string;
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
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		// Nettoyer la base avant chaque test (ordre important)
		await prisma.avoirApplication.deleteMany({});
		await prisma.avoirLine.deleteMany({});
		await prisma.avoir.deleteMany({});
		await prisma.payment.deleteMany({});
		await prisma.invoiceLine.deleteMany({});
		await prisma.invoice.deleteMany({});
		await prisma.quoteView.deleteMany({});
		await prisma.emailEvent.deleteMany({});
		await prisma.quoteLine.deleteMany({});
		await prisma.quote.deleteMany({});
		await prisma.subscription.deleteMany({});
		await prisma.pack.deleteMany({});
		await prisma.prospect.deleteMany({});
		await prisma.taxSimulation.deleteMany({});
		await prisma.taxCredit.deleteMany({});
		await prisma.amortization.deleteMany({});
		await prisma.taxDeduction.deleteMany({});
		await prisma.client.deleteMany({});
		await prisma.user.deleteMany({});
		await prisma.organizationDocument.deleteMany({});
		// Supprimer les organisations en dernier car elles sont référencées par clients et users
		await prisma.organization.deleteMany({});

		// Recréer l'utilisateur de test avec organisation
		testUser = await createTestUser(app, prisma);

		// Créer un client de test avec l'organisation de l'utilisateur de test
		const client = await prisma.client.create({
			data: {
				name: 'Test Client',
				email: `test-${Date.now()}@example.com`,
				isCompany: true,
				organizationId: testUser.organizationId,
			},
		});
		clientId = client.id;
	});

	describe('POST /avoirs', () => {
		it('devrait créer un avoir valide', () => {
			return authenticatedRequest(app, testUser.cookies)
				.post('/api/avoirs')
				.send({
					clientId,
					lines: [
						{
							description: 'Remboursement',
							quantity: 1,
							unitPrice: 100,
							taxRate: 0.2
						}
					]
				})
				.expect(201)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('id');
					expect(res.body).toHaveProperty('number');
					expect(res.body.clientId).toBe(clientId);
					expect(res.body.lines).toHaveLength(1);
					expect(Number(res.body.total)).toBe(120);
				});
		});

		it('devrait rejeter un avoir sans lignes', () => {
			return authenticatedRequest(app, testUser.cookies)
				.post('/api/avoirs')
				.send({
					clientId,
					lines: []
				})
				.expect(400);
		});

		it('devrait rejeter un avoir avec un client invalide', () => {
			return authenticatedRequest(app, testUser.cookies)
				.post('/api/avoirs')
				.send({
					clientId: '0000000000',
					lines: [
						{
							description: 'Test',
							quantity: 1,
							unitPrice: 100
						}
					]
				})
				.expect(404);
		});
	});

	describe('GET /avoirs', () => {
		beforeEach(async () => {
			// Créer des avoirs de test
			await prisma.avoir.createMany({
				data: [
					{
						number: 'AVO-2024-0001',
						clientId,
						organizationId: testUser.organizationId,
						date: new Date(),
						status: 'DRAFT',
						subtotal: 100,
						tax: 20,
						total: 120,
						appliedAmount: 0,
						currency: 'EUR',
					},
					{
						number: 'AVO-2024-0002',
						clientId,
						organizationId: testUser.organizationId,
						date: new Date(),
						status: 'SENT',
						subtotal: 200,
						tax: 40,
						total: 240,
						appliedAmount: 0,
						currency: 'EUR',
					},
				],
			});
		});

		it('devrait retourner la liste des avoirs', () => {
			return authenticatedRequest(app, testUser.cookies)
				.get('/api/avoirs')
				.expect(200)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('data');
					expect(res.body).toHaveProperty('pagination');
					expect(res.body.data.length).toBeGreaterThan(0);
				});
		});

		it('devrait paginer les résultats', () => {
			return authenticatedRequest(app, testUser.cookies)
				.get('/api/avoirs?page=1&pageSize=1')
				.expect(200)
				.expect((res: any) => {
					expect(res.body.data.length).toBe(1);
					expect(res.body.pagination.pageSize).toBe(1);
				});
		});
	});

	describe('GET /avoirs/:id', () => {
		it('devrait retourner un avoir existant', async () => {
			const avoir = await prisma.avoir.create({
				data: {
					number: 'AVO-2024-0001',
					clientId,
					organizationId: testUser.organizationId,
					invoiceId: null,
					date: new Date(),
					status: 'DRAFT',
					subtotal: 100,
					tax: 20,
					total: 120,
					appliedAmount: 0,
					currency: 'EUR',
				},
			});

			return authenticatedRequest(app, testUser.cookies)
				.get(`/api/avoirs/${avoir.id}`)
				.expect(200)
				.expect((res: any) => {
					expect(res.body.id).toBe(avoir.id);
					expect(res.body.number).toBe('AVO-2024-0001');
				});
		});

		it('devrait retourner 404 pour un avoir inexistant', () => {
			return authenticatedRequest(app, testUser.cookies).get('/api/avoirs/99999').expect(404);
		});
	});

	describe('POST /avoirs/:id/apply', () => {
		it('devrait imputer un avoir sur une facture', async () => {
			const avoir = await prisma.avoir.create({
				data: {
					number: 'AVO-2024-0001',
					clientId,
					organizationId: testUser.organizationId,
					invoiceId: null,
					date: new Date(),
					status: 'DRAFT',
					subtotal: 100,
					tax: 20,
					total: 120,
					appliedAmount: 0,
					currency: 'EUR',
				},
			});

			const invoice = await prisma.invoice.create({
				data: {
					number: 'FAC-2024-0001',
					clientId,
					organizationId: testUser.organizationId,
					date: new Date(),
					status: 'SENT',
					subtotal: 200,
					tax: 40,
					total: 240,
					balance: 240,
					currency: 'EUR',
				},
			});

			return authenticatedRequest(app, testUser.cookies)
				.post(`/api/avoirs/${avoir.id}/apply`)
				.send({
					invoiceId: invoice.id,
					amount: 50
				})
				.expect(200)
				.expect((res: any) => {
					expect(res.body.applications).toHaveLength(1);
					expect(Number(res.body.appliedAmount)).toBe(50);
				});
		});
	});
});

