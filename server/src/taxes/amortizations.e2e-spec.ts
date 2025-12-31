import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';

/**
 * Tests E2E pour les amortissements
 */
describe('AmortizationsController (e2e)', () => {
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
				skipMissingProperties: true,
				skipNullProperties: true,
				skipUndefinedProperties: true,
				transformOptions: {
					enableImplicitConversion: true,
				},
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

	describe('POST /api/taxes/amortizations', () => {
		it('devrait créer un amortissement linéaire', () => {
			return authenticatedRequest(app, authCookies)
				.post('/api/taxes/amortizations')
				.send({
					assetName: 'Ordinateur portable',
					purchaseDate: '2024-01-01',
					purchaseAmount: 1500,
					method: 'LINEAR',
					duration: 3,
				})
				.expect(201)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('id');
					expect(res.body.assetName).toBe('Ordinateur portable');
					expect(res.body.schedule).toBeDefined();
					expect(Array.isArray(res.body.schedule)).toBe(true);
					expect(res.body.schedule.length).toBe(3);
				});
		});

		it('devrait créer un amortissement dégressif', () => {
			return authenticatedRequest(app, authCookies)
				.post('/api/taxes/amortizations')
				.send({
					assetName: 'Véhicule',
					purchaseDate: '2024-01-01',
					purchaseAmount: 20000,
					method: 'DECLINING',
					duration: 5,
					coefficient: 1.75,
				})
				.expect(201)
				.expect((res: any) => {
					expect(res.body.method).toBe('DECLINING');
					expect(res.body.schedule).toBeDefined();
				});
		});
	});

	describe('GET /api/taxes/amortizations/list', () => {
		it('devrait retourner une liste d\'amortissements', () => {
			return authenticatedRequest(app, authCookies)
				.get('/api/taxes/amortizations/list')
				.expect(200)
				.expect((res: any) => {
					expect(Array.isArray(res.body)).toBe(true);
				});
		});
	});

	describe('GET /api/taxes/amortizations/totals/:year', () => {
		it('devrait calculer le total des amortissements pour une année', () => {
			return authenticatedRequest(app, authCookies)
				.get('/api/taxes/amortizations/totals/2024')
				.expect(200)
				.expect((res: any) => {
					expect(res.body).toHaveProperty('year', 2024);
					expect(res.body).toHaveProperty('total');
					expect(res.body).toHaveProperty('count');
				});
		});
	});
});

