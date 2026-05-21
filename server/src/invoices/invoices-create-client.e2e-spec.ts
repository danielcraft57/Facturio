import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, TestUser } from '../common/test-helpers/auth.helper';

function uniqueEmail(local: string): string {
	return `${local}+${Date.now()}@example.com`;
}

describe('Invoices create client from email (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: TestUser;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
		app = moduleRef.createNestApplication();
		app.setGlobalPrefix('api');
		app.use(cookieParser());
		app.useGlobalPipes(
			new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }),
		);
		await app.init();
		prisma = app.get(PrismaService);
		testUser = await createTestUser(app, prisma);
	});

	afterAll(async () => {
		await app.close();
	});

	it('POST /api/invoices avec clientEmail seul crée le client', async () => {
		const email = uniqueEmail('invoice-auto-client');
		const httpServer = app.getHttpServer();

		const loginRes = await request(httpServer)
			.post('/api/auth/login')
			.send({ email: testUser.email, password: 'password123' })
			.expect(201);

		const token = loginRes.body.access_token;

		const invoice = await request(httpServer)
			.post('/api/invoices')
			.set('Authorization', `Bearer ${token}`)
			.send({
				clientEmail: email,
				clientName: 'Société Auto',
				paidExternally: true,
				lines: [{ description: 'Presta', quantity: 1, unitPrice: 100, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { clientId: number; status: string } }) => r.body);

		expect(invoice.status).toBe('PAID');

		const client = await prisma.client.findUnique({ where: { email } });
		expect(client?.name).toBe('Société Auto');
		expect(client?.id).toBe(invoice.clientId);
	});
});
