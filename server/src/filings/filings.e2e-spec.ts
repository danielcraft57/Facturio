import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestUser, authenticatedRequest, TestUser } from '../../src/common/test-helpers/auth.helper';

describe('Filings e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: TestUser;

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
		// Nettoyage des entités liées aux déclarations et factures.
		// On garde les clients et les taux de TVA partagés pour éviter les erreurs de FK
		// avec les autres suites de tests.
		// Nettoyer la base (ordre important : supprimer d'abord les entités dépendantes)
		await prisma.quoteView.deleteMany({});
		await prisma.emailEvent.deleteMany({});
		await prisma.quoteLine.deleteMany({});
		await prisma.quote.deleteMany({});
		await prisma.invoiceLine.deleteMany({});
		await prisma.payment.deleteMany({});
		await prisma.filingLine.deleteMany({});
		await prisma.authorityPayment.deleteMany({});
		await prisma.filing.deleteMany({});
		await prisma.avoirApplication.deleteMany({});
		await prisma.avoirLine.deleteMany({});
		await prisma.avoir.deleteMany({});
		await prisma.invoice.deleteMany({});
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
		// Supprimer les organisations en dernier
		await prisma.organization.deleteMany({});

		// Recréer l'utilisateur de test avec organisation
		testUser = await createTestUser(app, prisma);
	});

	afterAll(async () => {
		await app.close();
	});

	// ========================================
	// TESTS UNITAIRES - CRUD BASIQUE
	// ========================================

	it('create -> calculate VAT -> add payment -> status paid', async () => {
		// CREATE FILING
		const filing = await authenticatedRequest(app, testUser.cookies)
			.post('/api/filings')
			.send({ period: '2024-Q1', type: 'VAT' })
			.expect(201)
			.then((r: any) => r.body);

		expect(filing.id).toBeDefined();
		expect(filing.period).toBe('2024-Q1');
		expect(filing.status).toBe('draft');

		// CALCULATE VAT
		const calculated = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/filings/${filing.id}/calculate`)
			.expect(200)
			.then((r: any) => r.body);

		expect(calculated.vatAmount).toBeDefined();
		expect(calculated.status).toBe('calculated');

		// ADD PAYMENT
		const payment = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/filings/${filing.id}/payments`)
			.send({ amount: calculated.vatAmount, method: 'bank_transfer' })
			.expect(201)
			.then((r: any) => r.body);

		expect(payment.amount).toBe(calculated.vatAmount);

		// VERIFY STATUS PAID
		const finalFiling = await authenticatedRequest(app, testUser.cookies).get(`/api/filings/${filing.id}`).expect(200).then((r: any) => r.body);
		expect(finalFiling.status).toBe('paid');
	});

	// ========================================
	// TESTS D'INTÉGRATION - CALCULS COMPLEXES
	// ========================================

	it('complex VAT calculations with multiple invoices', async () => {
		// Créer des clients et factures avec des emails uniques pour éviter
		// les collisions de contrainte d'unicité entre plusieurs runs.
		const suffix = Date.now();
		const client1 = await prisma.client.create({
			data: { name: 'Client 1', email: `client1+${suffix}@test.com`, isCompany: true, countryCode: 'FR', organizationId: testUser.organizationId }
		});
		const client2 = await prisma.client.create({
			data: { name: 'Client 2', email: `client2+${suffix}@test.com`, isCompany: true, countryCode: 'DE', organizationId: testUser.organizationId }
		});

		// Facture avec TVA française (20%)
		const invoice1 = await authenticatedRequest(app, testUser.cookies)
			.post('/api/invoices')
			.send({
				clientId: client1.id,
				organizationId: testUser.organizationId,
				lines: [{ description: 'Service FR', quantity: 1, unitPrice: 1000 }]
			})
			.expect(201)
			.then((r: any) => r.body);

		// Facture avec TVA allemande (19%)
		const invoice2 = await authenticatedRequest(app, testUser.cookies)
			.post('/api/invoices')
			.send({
				clientId: client2.id,
				organizationId: testUser.organizationId,
				lines: [{ description: 'Service DE', quantity: 1, unitPrice: 500 }]
			})
			.expect(201)
			.then((r: any) => r.body);

		// Créer et calculer la déclaration
		const filing = await authenticatedRequest(app, testUser.cookies)
			.post('/api/filings')
			.send({ period: '2024-Q1', type: 'VAT' })
			.expect(201)
			.then((r: any) => r.body);

		const calculated = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/filings/${filing.id}/calculate`)
			.expect(200)
			.then((r: any) => r.body);

		// Vérifier les calculs
		expect(calculated.vatAmount).toBeGreaterThan(0);
		expect(calculated.invoiceCount).toBe(2);
		expect(calculated.totalAmount).toBe(1500); // 1000 + 500
	});

	// ========================================
	// TESTS DE PERFORMANCE - PÉRIODES
	// ========================================

	it('filing periods and status management', async () => {
		// Créer plusieurs déclarations pour différentes périodes
		const periods = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'];
		const filings = [];

		for (const period of periods) {
			const filing = await authenticatedRequest(app, testUser.cookies)
				.post('/api/filings')
				.send({ period, type: 'VAT' })
				.expect(201)
				.then((r: any) => r.body);
			filings.push(filing);
		}

		// Lister toutes les déclarations
		const allFilings = await authenticatedRequest(app, testUser.cookies).get('/api/filings').expect(200).then((r: any) => r.body);
		expect(allFilings).toHaveLength(4);

		// Filtrer par période
		const q1Filings = await authenticatedRequest(app, testUser.cookies).get('/api/filings?period=2024-Q1').expect(200).then((r: any) => r.body);
		expect(q1Filings).toHaveLength(1);
		expect(q1Filings[0].period).toBe('2024-Q1');

		// Filtrer par statut
		const draftFilings = await authenticatedRequest(app, testUser.cookies).get('/api/filings?status=draft').expect(200).then((r: any) => r.body);
		expect(draftFilings.length).toBeGreaterThan(0);
		expect(draftFilings.every((f: any) => f.status === 'draft')).toBe(true);
	});

	// ========================================
	// TESTS DE VALIDATION - ERREURS
	// ========================================

	it('validation errors', async () => {
		// Période invalide
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/filings')
			.send({ period: 'invalid-period', type: 'VAT' })
			.expect(400);

		// Type invalide
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/filings')
			.send({ period: '2024-Q1', type: 'INVALID' })
			.expect(400);

		// Montant de paiement négatif
		const filing = await authenticatedRequest(app, testUser.cookies)
			.post('/api/filings')
			.send({ period: '2024-Q1', type: 'VAT' })
			.expect(201)
			.then((r: any) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/filings/${filing.id}/payments`)
			.send({ amount: -100, method: 'bank_transfer' })
			.expect(400);
	});
});
