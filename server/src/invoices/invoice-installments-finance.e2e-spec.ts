import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';
import { generateEntityId } from '../common/entity-id';

describe('Échéancier — finance (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: { cookies: string[]; organizationId: number };
	let clientId: string;

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
		await prisma.organization.update({
			where: { id: testUser.organizationId },
			data: { saasPlan: 'PRO' },
		});
	});

	afterAll(async () => {
		await app.close();
	});

	async function purgeOrgInvoices(organizationId: number) {
		await prisma.invoiceInstallment.deleteMany({ where: { invoice: { organizationId } } });
		await prisma.payment.deleteMany({ where: { invoice: { organizationId } } });
		await prisma.invoiceLine.deleteMany({ where: { invoice: { organizationId } } });
		await prisma.invoice.deleteMany({ where: { organizationId } });
		await prisma.client.deleteMany({ where: { organizationId } });
	}

	beforeEach(async () => {
		await purgeOrgInvoices(testUser.organizationId);
		const client = await prisma.client.create({
			data: {
				id: generateEntityId(),
				name: 'Client Échéancier',
				email: `ech-${Date.now()}@test.com`,
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		});
		clientId = client.id;
	});

	it('GET installments — créances auto et écritures comptables', async () => {
		const invoice = await authenticatedRequest(app, testUser.cookies)
			.post('/api/invoices')
			.send({
				clientId,
				applyClientCredits: false,
				lines: [{ description: 'Mission', quantity: 1, unitPrice: 250, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string; total: unknown; number: string } }) => r.body);

		const total = Number(invoice.total);
		await authenticatedRequest(app, testUser.cookies)
			.put(`/api/invoices/${invoice.id}/installments`)
			.send({
				installments: [
					{ amount: total / 2, dueDate: '2026-04-01' },
					{ amount: total / 2, dueDate: '2026-05-01' },
				],
			})
			.expect(200);

		await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/invoices/${invoice.id}`)
			.send({ status: 'SENT' })
			.expect(200);

		const beforePay = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/invoices/${invoice.id}/installments`)
			.expect(200)
			.then(
				(r: {
					body: {
						installments: Array<{
							sequence: number
							amount: number
							receivable: { autoTracked: boolean } | null
							accounting: { kind: string; posted: boolean } | null
						}>
						saleAccounting: { kind: string; posted: boolean; reference: string } | null
					}
				}) => r.body,
			);

		expect(beforePay.installments).toHaveLength(2);
		expect(beforePay.installments[0].receivable?.autoTracked).toBe(true);
		expect(beforePay.installments[0].accounting).toBeNull();
		expect(beforePay.saleAccounting?.kind).toBe('sale');
		expect(beforePay.saleAccounting?.posted).toBe(true);

		const firstAmount = beforePay.installments[0].amount;

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/invoices/${invoice.id}/payments`)
			.send({ amount: firstAmount, method: 'bank_transfer' })
			.expect(201);

		const afterPay = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/invoices/${invoice.id}/installments`)
			.expect(200)
			.then(
				(r: {
					body: {
						installments: Array<{
							status: string
							accounting: { kind: string; posted: boolean } | null
							receivable: unknown
						}>
					}
				}) => r.body,
			);

		const paid = afterPay.installments[0].status === 'PAID'
			? afterPay.installments[0]
			: afterPay.installments[1];
		const pending = afterPay.installments[0].status === 'PENDING'
			? afterPay.installments[0]
			: afterPay.installments[1];
		expect(paid?.accounting).toMatchObject({ kind: 'payment', posted: true });
		expect(paid?.receivable).toBeNull();
		expect(pending?.receivable).toBeTruthy();
	});

	it('GET /receivables — expose les échéances en créances auto', async () => {
		const invoice = await authenticatedRequest(app, testUser.cookies)
			.post('/api/invoices')
			.send({
				clientId,
				applyClientCredits: false,
				lines: [{ description: 'Plan 3x', quantity: 1, unitPrice: 300, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string; total: unknown } }) => r.body);

		const total = Number(invoice.total);
		const part = Number((total / 3).toFixed(2));
		const lastPart = Number((total - part * 2).toFixed(2));

		await authenticatedRequest(app, testUser.cookies)
			.put(`/api/invoices/${invoice.id}/installments`)
			.send({
				installments: [
					{ amount: part, dueDate: '2026-06-01' },
					{ amount: part, dueDate: '2026-07-01' },
					{ amount: lastPart, dueDate: '2026-08-01' },
				],
			})
			.expect(200);

		await prisma.invoice.update({
			where: { id: invoice.id },
			data: { status: 'SENT', balance: total },
		});

		const res = await authenticatedRequest(app, testUser.cookies)
			.get('/api/receivables')
			.expect(200)
			.then(
				(r: {
					body: {
						summary: { installmentCount: number; installmentOutstanding: number }
						installmentReceivables: Array<{
							invoiceId: string
							sequence: number
							amount: number
							autoTracked: boolean
						}>
					}
				}) => r.body,
			);

		expect(res.summary.installmentCount).toBe(3);
		expect(res.summary.installmentOutstanding).toBeCloseTo(total, 2);
		expect(res.installmentReceivables).toHaveLength(3);
		expect(res.installmentReceivables[0].invoiceId).toBe(invoice.id);
		expect(res.installmentReceivables[0].autoTracked).toBe(true);
	});
});
