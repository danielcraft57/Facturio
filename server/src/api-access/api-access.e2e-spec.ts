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

		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/api-access/tokens')
			.send({
				name: 'E2E token',
				permissions: [
					'clients.read',
					'clients.write',
					'factures.read',
					'factures.write',
					'factures.send',
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
