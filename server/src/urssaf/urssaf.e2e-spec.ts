import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest, TestUser } from '../common/test-helpers/auth.helper';
import { UrssafActivity } from './dto/update-organization-urssaf.dto';

/**
 * Tests E2E pour le module URSSAF
 * 
 * Ces tests vérifient le fonctionnement complet de l'API URSSAF :
 * - Calcul de cotisations via API
 * - Création de déclarations
 * - Récupération de l'historique
 * - Mise à jour de configuration
 * - Gestion des erreurs et validations
 * 
 * @requires Base de données de test configurée
 * @requires Authentification JWT fonctionnelle
 */
describe('Urssaf e2e', () => {
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
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		// Nettoyer la base
		await prisma.filingLine.deleteMany({});
		await prisma.authorityPayment.deleteMany({});
		await prisma.filing.deleteMany({});
		await prisma.invoiceLine.deleteMany({});
		await prisma.invoice.deleteMany({});
		await prisma.client.deleteMany({});
		await prisma.user.deleteMany({});
		await prisma.organization.deleteMany({});

		// Créer un utilisateur de test avec organisation auto-entrepreneur
		testUser = await createTestUser(app, prisma, {
			organizationName: 'Test Auto-Entrepreneur',
		});

		// Mettre à jour l'organisation pour être auto-entrepreneur
		await prisma.organization.update({
			where: { id: testUser.organizationId },
			data: {
				companyStatus: 'AUTO_ENTREPRENEUR',
				urssafActivity: UrssafActivity.SERVICE_BIC,
				urssafFiscalOption: false,
				urssafDeclarationFrequency: 'MONTHLY',
			},
		});

		// Créer un client de test
		const client = await prisma.client.create({
			data: {
				name: 'Test Client',
				email: `client-${Date.now()}@example.com`,
				isCompany: true,
				organizationId: testUser.organizationId,
			},
		});

		// Créer des factures de test pour janvier 2024
		await prisma.invoice.create({
			data: {
				number: 'INV-2024-001',
				date: new Date('2024-01-15'),
				clientId: client.id,
				organizationId: testUser.organizationId,
				status: 'PAID',
				subtotal: 5000,
				tax: 1000,
				total: 6000,
				balance: 0,
				currency: 'EUR',
			},
		});

		await prisma.invoice.create({
			data: {
				number: 'INV-2024-002',
				date: new Date('2024-01-20'),
				clientId: client.id,
				organizationId: testUser.organizationId,
				status: 'SENT',
				subtotal: 3000,
				tax: 600,
				total: 3600,
				balance: 3600,
				currency: 'EUR',
			},
		});
	});

	describe('POST /urssaf/calculate', () => {
		it('devrait calculer la cotisation URSSAF', async () => {
			const response = await authenticatedRequest(app, testUser.cookies)
				.post('/api/urssaf/calculate')
				.send({
					organizationId: testUser.organizationId,
					periodStart: '2024-01-01',
					periodEnd: '2024-01-31',
				})
				.expect(201);

			expect(response.body).toHaveProperty('ca');
			expect(response.body).toHaveProperty('rate');
			expect(response.body).toHaveProperty('contribution');
			expect(response.body).toHaveProperty('activity');
			expect(response.body.ca).toBe(9600); // 6000 + 3600
			expect(response.body.rate).toBe(0.22); // Taux SERVICE_BIC par défaut
			expect(response.body.contribution).toBeCloseTo(2112, 0); // 9600 * 0.22
		});

		it('devrait rejeter si organisation non éligible', async () => {
			// Mettre à jour l'organisation en SARL
			await prisma.organization.update({
				where: { id: testUser.organizationId },
				data: { companyStatus: 'SARL' },
			});

			await authenticatedRequest(app, testUser.cookies)
				.post('/api/urssaf/calculate')
				.send({
					organizationId: testUser.organizationId,
					periodStart: '2024-01-01',
					periodEnd: '2024-01-31',
				})
				.expect(400);
		});
	});

	describe('POST /urssaf/filing', () => {
		it('devrait créer une déclaration URSSAF mensuelle', async () => {
			const response = await authenticatedRequest(app, testUser.cookies)
				.post('/api/urssaf/filing')
				.send({
					organizationId: testUser.organizationId,
					period: '2024-M01',
				})
				.expect(201);

			expect(response.body).toHaveProperty('id');
			expect(response.body).toHaveProperty('type');
			expect(response.body.type).toBe('URSSAF_MONTHLY');
			expect(response.body).toHaveProperty('calculation');
			expect(response.body.calculation).toHaveProperty('contribution');
		});

		it('devrait créer une déclaration URSSAF trimestrielle', async () => {
			const response = await authenticatedRequest(app, testUser.cookies)
				.post('/api/urssaf/filing')
				.send({
					organizationId: testUser.organizationId,
					period: '2024-Q1',
				})
				.expect(201);

			expect(response.body.type).toBe('URSSAF_QUARTERLY');
		});

		it('devrait rejeter un format de période invalide', async () => {
			await authenticatedRequest(app, testUser.cookies)
				.post('/api/urssaf/filing')
				.send({
					organizationId: testUser.organizationId,
					period: 'invalid-format',
				})
				.expect(400);
		});
	});

	describe('GET /urssaf/contributions', () => {
		it('devrait retourner l\'historique des cotisations', async () => {
			// Créer une déclaration d'abord
			await authenticatedRequest(app, testUser.cookies)
				.post('/api/urssaf/filing')
				.send({
					organizationId: testUser.organizationId,
					period: '2024-M01',
				});

			const response = await authenticatedRequest(app, testUser.cookies)
				.get('/api/urssaf/contributions')
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);
		});
	});

	describe('PATCH /urssaf/organization', () => {
		it('devrait mettre à jour la configuration URSSAF', async () => {
			const response = await authenticatedRequest(app, testUser.cookies)
				.patch('/api/urssaf/organization')
				.send({
					urssafActivity: UrssafActivity.VENTE,
					urssafFiscalOption: true,
					urssafDeclarationFrequency: 'QUARTERLY',
				})
				.expect(200);

			expect(response.body.urssafActivity).toBe(UrssafActivity.VENTE);
			expect(response.body.urssafFiscalOption).toBe(true);
			expect(response.body.urssafDeclarationFrequency).toBe('QUARTERLY');
		});
	});
});

