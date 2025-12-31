import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';

/**
 * Tests E2E pour l'optimisation de rémunération
 */
describe('CompensationOptimizationController (e2e)', () => {
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

	describe('POST /api/taxes/compensation/optimize', () => {
		it('devrait optimiser la rémunération', () => {
			return authenticatedRequest(app, authCookies)
				.post('/api/taxes/compensation/optimize')
				.send({
					totalAmount: 50000,
					currentProfit: 100000,
					isPME: true,
				})
				.expect(201)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('totalAmount', 50000);
					expect(res.body).toHaveProperty('salary');
					expect(res.body).toHaveProperty('dividends');
					expect(res.body).toHaveProperty('recommendation');
					expect(res.body.recommendation).toHaveProperty('bestOption');
					expect(['SALARY', 'DIVIDENDS', 'MIXED']).toContain(
						res.body.recommendation.bestOption
					);
				});
		});

		it('devrait calculer correctement les coûts salaire', () => {
			return authenticatedRequest(app, authCookies)
				.post('/api/taxes/compensation/optimize')
				.send({
					totalAmount: 50000,
				})
				.expect(201)
				.expect((res: any) => {
					expect(res.body.salary.grossSalary).toBe(50000);
					expect(res.body.salary.totalCost).toBeGreaterThan(50000);
					expect(res.body.salary.netAfterTax).toBeLessThan(50000);
				});
		});
	});
});

