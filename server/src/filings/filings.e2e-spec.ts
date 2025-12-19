import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Filings e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
		app = moduleRef.createNestApplication();
		await app.init();
		prisma = app.get(PrismaService);
		// Nettoyage des entités liées aux déclarations et factures.
		// On garde les clients et les taux de TVA partagés pour éviter les erreurs de FK
		// avec les autres suites de tests.
		await prisma.$executeRawUnsafe('DELETE FROM QuoteView');
		await prisma.$executeRawUnsafe('DELETE FROM EmailEvent');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteLine');
		await prisma.$executeRawUnsafe('DELETE FROM Quote');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
		await prisma.$executeRawUnsafe('DELETE FROM FilingLine');
		await prisma.$executeRawUnsafe('DELETE FROM AuthorityPayment');
		await prisma.$executeRawUnsafe('DELETE FROM Filing');
	});

	afterAll(async () => {
		await app.close();
	});

	// ========================================
	// TESTS UNITAIRES - CRUD BASIQUE
	// ========================================

	it('create -> calculate VAT -> add payment -> status paid', async () => {
		// CREATE FILING
		const filing = await request(app.getHttpServer())
			.post('/filings')
			.send({ period: '2024-Q1', type: 'VAT' })
			.expect(201)
			.then(r => r.body);

		expect(filing.id).toBeDefined();
		expect(filing.period).toBe('2024-Q1');
		expect(filing.status).toBe('draft');

		// CALCULATE VAT
		const calculated = await request(app.getHttpServer())
			.post(`/filings/${filing.id}/calculate`)
			.expect(200)
			.then(r => r.body);

		expect(calculated.vatAmount).toBeDefined();
		expect(calculated.status).toBe('calculated');

		// ADD PAYMENT
		const payment = await request(app.getHttpServer())
			.post(`/filings/${filing.id}/payments`)
			.send({ amount: calculated.vatAmount, method: 'bank_transfer' })
			.expect(201)
			.then(r => r.body);

		expect(payment.amount).toBe(calculated.vatAmount);

		// VERIFY STATUS PAID
		const finalFiling = await request(app.getHttpServer()).get(`/filings/${filing.id}`).expect(200).then(r => r.body);
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
			data: { name: 'Client 1', email: `client1+${suffix}@test.com`, isCompany: true, countryCode: 'FR' }
		});
		const client2 = await prisma.client.create({
			data: { name: 'Client 2', email: `client2+${suffix}@test.com`, isCompany: true, countryCode: 'DE' }
		});

		// Facture avec TVA française (20%)
		const invoice1 = await request(app.getHttpServer())
			.post('/invoices')
			.send({
				clientId: client1.id,
				lines: [{ description: 'Service FR', quantity: 1, unitPrice: 1000 }]
			})
			.expect(201)
			.then(r => r.body);

		// Facture avec TVA allemande (19%)
		const invoice2 = await request(app.getHttpServer())
			.post('/invoices')
			.send({
				clientId: client2.id,
				lines: [{ description: 'Service DE', quantity: 1, unitPrice: 500 }]
			})
			.expect(201)
			.then(r => r.body);

		// Créer et calculer la déclaration
		const filing = await request(app.getHttpServer())
			.post('/filings')
			.send({ period: '2024-Q1', type: 'VAT' })
			.expect(201)
			.then(r => r.body);

		const calculated = await request(app.getHttpServer())
			.post(`/filings/${filing.id}/calculate`)
			.expect(200)
			.then(r => r.body);

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
			const filing = await request(app.getHttpServer())
				.post('/filings')
				.send({ period, type: 'VAT' })
				.expect(201)
				.then(r => r.body);
			filings.push(filing);
		}

		// Lister toutes les déclarations
		const allFilings = await request(app.getHttpServer()).get('/filings').expect(200).then(r => r.body);
		expect(allFilings).toHaveLength(4);

		// Filtrer par période
		const q1Filings = await request(app.getHttpServer()).get('/filings?period=2024-Q1').expect(200).then(r => r.body);
		expect(q1Filings).toHaveLength(1);
		expect(q1Filings[0].period).toBe('2024-Q1');

		// Filtrer par statut
		const draftFilings = await request(app.getHttpServer()).get('/filings?status=draft').expect(200).then(r => r.body);
		expect(draftFilings.length).toBeGreaterThan(0);
		expect(draftFilings.every((f: any) => f.status === 'draft')).toBe(true);
	});

	// ========================================
	// TESTS DE VALIDATION - ERREURS
	// ========================================

	it('validation errors', async () => {
		// Période invalide
		await request(app.getHttpServer())
			.post('/filings')
			.send({ period: 'invalid-period', type: 'VAT' })
			.expect(400);

		// Type invalide
		await request(app.getHttpServer())
			.post('/filings')
			.send({ period: '2024-Q1', type: 'INVALID' })
			.expect(400);

		// Montant de paiement négatif
		const filing = await request(app.getHttpServer())
			.post('/filings')
			.send({ period: '2024-Q1', type: 'VAT' })
			.expect(201)
			.then(r => r.body);

		await request(app.getHttpServer())
			.post(`/filings/${filing.id}/payments`)
			.send({ amount: -100, method: 'bank_transfer' })
			.expect(400);
	});
});
