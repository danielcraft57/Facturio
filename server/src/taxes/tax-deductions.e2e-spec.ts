import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';

/**
 * Tests E2E pour les déductions fiscales
 * 
 * Teste les endpoints API :
 * - Création, lecture, mise à jour, suppression
 * - Calcul des totaux
 * - Validation/rejet
 */
describe('TaxDeductionsController (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let authCookies: string[];
	let organizationId: number;

	beforeAll(async () => {
		// Définir les variables d'environnement pour Google OAuth (requis pour l'initialisation)
		process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client-id';
		process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret';
		process.env.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';

		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.setGlobalPrefix('api');
		app.use(cookieParser());
		// Utiliser un ValidationPipe qui ne transforme pas les query params
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				transform: true,
				forbidUnknownValues: false,
				transformOptions: {
					enableImplicitConversion: false,
				},
			}),
		);
		await app.init();
		prisma = moduleFixture.get<PrismaService>(PrismaService);

		// Créer un utilisateur de test
		const testUser = await createTestUser(app, prisma);
		authCookies = testUser.cookies;
		organizationId = testUser.organizationId;
	});

	afterAll(async () => {
		if (prisma) {
			await prisma.$disconnect();
		}
		if (app) {
			await app.close();
		}
	});

	describe('POST /api/taxes/deductions', () => {
		it('devrait créer une déduction fiscale', () => {
			return authenticatedRequest(app, authCookies)
				.post('/api/taxes/deductions')
				.send({
					category: 'EXPENSE',
					name: 'Frais de déplacement',
					amount: 500,
					year: 2024,
				})
				.expect(201)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('id');
					expect(res.body.name).toBe('Frais de déplacement');
					expect(Number(res.body.amount)).toBe(500);
					expect(res.body.status).toBe('PENDING');
				});
		});

		it('devrait rejeter un montant négatif', () => {
			return authenticatedRequest(app, authCookies)
				.post('/api/taxes/deductions')
				.send({
					category: 'EXPENSE',
					name: 'Test',
					amount: -100,
					year: 2024,
				})
				.expect(400);
		});
	});

	describe('GET /api/taxes/deductions/list', () => {
		it('devrait retourner une liste de déductions', async () => {
			const res = await authenticatedRequest(app, authCookies)
				.get('/api/taxes/deductions/list');
			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('items');
			expect(res.body).toHaveProperty('total');
			expect(Array.isArray(res.body.items)).toBe(true);
		});

		it('devrait filtrer par année', () => {
			return authenticatedRequest(app, authCookies)
				.get('/api/taxes/deductions/list?year=2024')
				.expect(200);
		});
	});

	describe('GET /api/taxes/deductions/totals/:year', () => {
		it('devrait calculer le total des déductions pour une année', () => {
			return authenticatedRequest(app, authCookies)
				.get('/api/taxes/deductions/totals/2024')
				.expect(200)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('year', 2024);
					expect(res.body).toHaveProperty('total');
					expect(res.body).toHaveProperty('count');
				});
		});
	});

	describe('PATCH /api/taxes/deductions/:id/validate', () => {
		it('devrait valider une déduction', async () => {
			// Créer une déduction
			const createRes = await authenticatedRequest(app, authCookies)
				.post('/api/taxes/deductions')
				.send({
					category: 'EXPENSE',
					name: 'Test validation',
					amount: 200,
					year: 2024,
				})
				.expect(201);

			const deductionId = createRes.body.id;

			// Valider
			return authenticatedRequest(app, authCookies)
				.patch(`/api/taxes/deductions/${deductionId}/validate`)
				.expect(200)
				.expect((res: any) => {
					expect(res.body.status).toBe('VALIDATED');
				});
		});
	});
});

