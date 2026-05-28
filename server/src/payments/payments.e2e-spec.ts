import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest, type TestUser } from '../common/test-helpers/auth.helper';
import { generateEntityId } from '../common/entity-id';

function uniqueEmail(base: string): string {
	const [local, domain] = base.split('@');
	return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@${domain}`;
}

describe('Payments e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: TestUser;
	let testClientId: string;
	let testInvoiceId: string;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

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

		await prisma.$executeRawUnsafe('DELETE FROM AvoirApplication');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirLine');
		await prisma.$executeRawUnsafe('DELETE FROM Avoir');
		await prisma.$executeRawUnsafe('DELETE FROM Refund');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');

		const client = await prisma.client.create({
			data: { id: generateEntityId(), 
				name: 'Test Client Payment',
				email: uniqueEmail('payment-test@example.com'),
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		});
		testClientId = client.id;

		const invoice = await prisma.invoice.create({
			data: { id: generateEntityId(), 
				number: `TEST-PAY-${Date.now()}`,
				clientId: testClientId,
				organizationId: testUser.organizationId,
				status: 'SENT',
				subtotal: 1000,
				tax: 200,
				total: 1200,
				balance: 1200,
				currency: 'EUR',
				lines: {
					create: {
						description: 'Test line',
						quantity: 1,
						unitPrice: 1000,
						taxRate: 0.2,
						taxAmount: 200,
						total: 1200,
					},
				},
			},
		});
		testInvoiceId = invoice.id;
	});

	afterAll(async () => {
		await prisma.$executeRawUnsafe('DELETE FROM AvoirApplication');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirLine');
		await prisma.$executeRawUnsafe('DELETE FROM Avoir');
		await prisma.$executeRawUnsafe('DELETE FROM Refund');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
		await prisma.client.deleteMany({ where: { id: testClientId } });
		await app.close();
	});

	it('create -> list -> get -> update -> delete', async () => {
		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payments')
			.send({
				invoiceId: testInvoiceId,
				amount: 500,
				method: 'Carte bancaire',
				notes: 'Paiement test',
			})
			.expect(201)
			.then((r: { body: unknown }) => r.body);

		expect(created.id).toBeDefined();
		expect(created.amount).toBe(500);
		expect(created.invoiceId).toBe(testInvoiceId);

		const list = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/payments?invoiceId=${testInvoiceId}`)
			.expect(200)
			.then((r: { body: unknown }) => r.body);

		expect(Array.isArray(list)).toBe(true);
		expect(list.length).toBeGreaterThanOrEqual(1);
		const found = list.find((p: { id: number }) => p.id === created.id);
		expect(found).toBeDefined();

		const retrieved = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/payments/${created.id}`)
			.expect(200)
			.then((r: { body: unknown }) => r.body);

		expect(retrieved.id).toBe(created.id);
		expect(retrieved.amount).toBe(500);

		const updated = await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/payments/${created.id}`)
			.send({ amount: 600, notes: 'Paiement modifié' })
			.expect(200)
			.then((r: { body: unknown }) => r.body);

		expect(updated.amount).toBe(600);
		expect(updated.notes).toBe('Paiement modifié');

		await authenticatedRequest(app, testUser.cookies).delete(`/api/payments/${created.id}`).expect(200);

		await authenticatedRequest(app, testUser.cookies).get(`/api/payments/${created.id}`).expect(404);
	});

	it('should not allow payment exceeding invoice balance', async () => {
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/payments')
			.send({
				invoiceId: testInvoiceId,
				amount: 2000,
			})
			.expect(400);
	});

	it('returns 404 for unknown payment', async () => {
		await authenticatedRequest(app, testUser.cookies).get('/api/payments/999999').expect(404);
	});
});
