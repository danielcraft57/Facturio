import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';

/**
 * Tests E2E pour les crédits d'impôt
 */
describe('TaxCreditsController (e2e)', () => {
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
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				transform: true,
				forbidUnknownValues: false,
			}),
		);
		await app.init();
		prisma = moduleFixture.get<PrismaService>(PrismaService);

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

	describe('POST /api/taxes/credits/calculate', () => {
		it('devrait calculer les crédits d\'impôt éligibles', () => {
			return authenticatedRequest(app, authCookies)
				.post('/api/taxes/credits/calculate')
				.send({
					year: 2024,
					expenses: {
						rnd: 10000,
						innovation: 5000,
						formation: 2000,
					},
				})
				.expect(201)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('credits');
					expect(res.body).toHaveProperty('totalCredit');
					expect(Array.isArray(res.body.credits)).toBe(true);
					expect(res.body.credits.length).toBeGreaterThan(0);
				});
		});
	});

	describe('POST /api/taxes/credits', () => {
		it('devrait créer un crédit d\'impôt', () => {
			return authenticatedRequest(app, authCookies)
				.post('/api/taxes/credits')
				.send({
					type: 'CIR',
					name: 'Crédit R&D',
					eligibleAmount: 10000,
					year: 2024,
				})
				.expect(201)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('id');
					expect(res.body.type).toBe('CIR');
					expect(Number(res.body.creditAmount)).toBe(3000); // 10000 * 0.30
				});
		});
	});

	describe('GET /api/taxes/credits/totals/:year', () => {
		it('devrait calculer le total des crédits pour une année', () => {
			return authenticatedRequest(app, authCookies)
				.get('/api/taxes/credits/totals/2024')
				.expect(200)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('year', 2024);
					expect(res.body).toHaveProperty('total');
					expect(res.body).toHaveProperty('count');
				});
		});
	});
});

