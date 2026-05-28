import * as request from 'supertest';
import { generateEntityId } from '../common/entity-id';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';
import { seedChartOfAccounts } from '../../prisma/seeds/base.seed';

const mockStripeService = {
	isOrgStripeConfigured: () => true,
	createPaymentIntentForInvoice: jest.fn(),
	handleOrgWebhook: jest.fn().mockResolvedValue({ received: true }),
	fulfillPaymentIntent: jest.fn(),
	refundPaymentIntent: jest.fn().mockResolvedValue('re_test_refund'),
};

describe('Refunds deposit e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: { cookies: string[]; organizationId: number };

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
			.overrideProvider(StripeService)
			.useValue(mockStripeService)
			.compile();
		app = moduleRef.createNestApplication();
		app.setGlobalPrefix('api');
		app.use(cookieParser());
		app.enableCors({ origin: true, credentials: true });
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
		await seedChartOfAccounts(prisma);

		await prisma.$executeRawUnsafe('DELETE FROM Refund');
		await prisma.$executeRawUnsafe('DELETE FROM JournalLine');
		await prisma.$executeRawUnsafe('DELETE FROM JournalEntry');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirApplication');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirLine');
		await prisma.$executeRawUnsafe('DELETE FROM Avoir');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await app.close();
	});

	it('cancel-deposit: rembourse acompte, avoir, solde annulé', async () => {
		await prisma.organization.update({
			where: { id: testUser.organizationId },
			data: {
				invoiceStripeSecretKey: 'sk_test_e2e_facturio',
				invoiceStripePublishableKey: 'pk_test_e2e_facturio',
			},
		});

		const client = await prisma.client.create({
			data: {
				id: generateEntityId(),
				name: 'Refund Client',
				email: `refund-${Date.now()}@test.com`,
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		});

		const quote = await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({
				clientId: client.id,
				lines: [{ description: 'Presta test', quantity: 1, unitPrice: 1000, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string; publicToken?: string } }) => r.body);

		const sendRes = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/quotes/${quote.id}/send`)
			.expect(201)
			.then((r: { body: { publicUrl: string } }) => r.body);

		const token = String(sendRes.publicUrl).split('/').filter(Boolean).pop()!;

		const acceptRes = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'DEPOSIT', depositRate: 0.1 })
			.expect(201)
			.then((r: { body: { depositInvoiceNumber?: string } }) => r.body);

		const deposit = await prisma.invoice.findFirst({
			where: { number: acceptRes.depositInvoiceNumber },
		});
		expect(deposit).toBeTruthy();

		const payAmount = Number(deposit!.total);
		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/invoices/${deposit!.id}/payments`)
			.send({ amount: payAmount, method: 'bank_transfer' })
			.expect(201);

		const cancelRes = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/invoices/${deposit!.id}/cancel-deposit`)
			.send({ reason: 'Rétractation client test' })
			.expect(201)
			.then((r: { body: { refunds?: unknown[]; avoir?: { number: string }; remainderInvoiceId?: string } }) => r.body);

		expect(cancelRes.refunds?.length).toBeGreaterThan(0);
		expect(cancelRes.avoir?.number).toMatch(/^AVO-/);

		const depositAfter = await prisma.invoice.findUnique({ where: { id: deposit!.id } });
		expect(depositAfter!.status).toBe('CANCELLED');
		expect(depositAfter!.tags).toContain('ACOMPTE_REFUNDED');

		if (cancelRes.remainderInvoiceId) {
			const remainder = await prisma.invoice.findUnique({
				where: { id: cancelRes.remainderInvoiceId },
			});
			expect(remainder!.status).toBe('CANCELLED');
		}

		const refundEntry = await prisma.journalEntry.findFirst({
			where: { reference: { contains: 'REMBOURSEMENT' } },
		});
		expect(refundEntry).toBeTruthy();
		const refundEmailEvents = await prisma.emailEvent.findMany({
			where: {
				invoiceId: deposit!.id,
				type: { startsWith: 'invoice_refund_notified:' },
			},
		});
		expect(refundEmailEvents.length).toBeGreaterThan(0);
	});

	it('cancel-deposit creditOnly: crée un crédit client + email, sans remboursement', async () => {
		const client = await prisma.client.create({
			data: {
				id: generateEntityId(),
				name: 'Credit Client',
				email: `credit-${Date.now()}@test.com`,
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		});

		const quote = await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({
				clientId: client.id,
				lines: [{ description: 'Presta test 2', quantity: 1, unitPrice: 900, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string } }) => r.body);

		const sendRes = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/quotes/${quote.id}/send`)
			.expect(201)
			.then((r: { body: { publicUrl: string } }) => r.body);

		const token = String(sendRes.publicUrl).split('/').filter(Boolean).pop()!;
		const acceptRes = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'DEPOSIT', depositRate: 0.1 })
			.expect(201)
			.then((r: { body: { depositInvoiceNumber?: string } }) => r.body);

		const deposit = await prisma.invoice.findFirst({
			where: { number: acceptRes.depositInvoiceNumber },
		});
		expect(deposit).toBeTruthy();

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/invoices/${deposit!.id}/payments`)
			.send({ amount: Number(deposit!.total), method: 'bank_transfer' })
			.expect(201);

		const cancelRes = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/invoices/${deposit!.id}/cancel-deposit`)
			.send({ reason: 'Annulation - crédit', creditOnly: true })
			.expect(201)
			.then((r: { body: { refunds?: unknown[]; avoir?: { number: string; invoiceId?: string | null } } }) => r.body);

		expect(cancelRes.refunds ?? []).toHaveLength(0);
		expect(cancelRes.avoir?.number).toMatch(/^AVO-/);
		expect(cancelRes.avoir?.invoiceId ?? null).toBeNull();

		const depositAfter = await prisma.invoice.findUnique({ where: { id: deposit!.id } });
		expect(depositAfter!.tags).toContain('ACOMPTE_CREDITED');

		const creditEmailEvent = await prisma.emailEvent.findFirst({
			where: {
				type: { startsWith: 'invoice_credit_notified:' },
			},
		});
		expect(creditEmailEvent).toBeTruthy();
	});

	it('cancel-deposit avec solde deja paye: cree 2 avoirs (acompte + solde)', async () => {
		const client = await prisma.client.create({
			data: {
				id: generateEntityId(),
				name: 'Double Avoir Client',
				email: `double-avoir-${Date.now()}@test.com`,
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		});

		const quote = await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({
				clientId: client.id,
				lines: [{ description: 'Presta test 3', quantity: 1, unitPrice: 1000, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string } }) => r.body);

		const sendRes = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/quotes/${quote.id}/send`)
			.expect(201)
			.then((r: { body: { publicUrl: string } }) => r.body);

		const token = String(sendRes.publicUrl).split('/').filter(Boolean).pop()!;
		const acceptRes = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'DEPOSIT', depositRate: 0.1 })
			.expect(201)
			.then((r: { body: { depositInvoiceNumber?: string } }) => r.body);

		const deposit = await prisma.invoice.findFirst({
			where: { number: acceptRes.depositInvoiceNumber },
		});
		expect(deposit).toBeTruthy();

		const remainder = await prisma.invoice.findFirst({
			where: {
				organizationId: testUser.organizationId,
				tags: { contains: `"SOLDE_APRES_ACOMPTE_OF:${quote.id}"` },
			},
		});
		expect(remainder).toBeTruthy();

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/invoices/${deposit!.id}/payments`)
			.send({ amount: Number(deposit!.total), method: 'bank_transfer' })
			.expect(201);
		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/invoices/${remainder!.id}/payments`)
			.send({ amount: Number(remainder!.total), method: 'bank_transfer' })
			.expect(201);

		const cancelRes = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/invoices/${deposit!.id}/cancel-deposit`)
			.send({ reason: 'Annulation apres paiement total' })
			.expect(201)
			.then((r: { body: { avoir?: { id: number }; remainderAvoir?: { id: number } } }) => r.body);

		expect(cancelRes.avoir?.id).toBeTruthy();
		expect(cancelRes.remainderAvoir?.id).toBeTruthy();

		const depositAfter = await prisma.invoice.findUnique({ where: { id: deposit!.id } });
		const remainderAfter = await prisma.invoice.findUnique({ where: { id: remainder!.id } });
		expect(depositAfter!.status).toBe('CANCELLED');
		expect(remainderAfter!.status).toBe('CANCELLED');
	});
});
