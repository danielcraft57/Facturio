import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';
import { generateEntityId } from '../common/entity-id';

describe('Receivables e2e', () => {
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
		testUser = await createTestUser(app, prisma, { saasPlan: 'PRO' });
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
				name: 'Client Créances',
				email: `creances-${Date.now()}@test.com`,
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		});
		clientId = client.id;
	});

	it('GET /receivables — vide sans facture ouverte', async () => {
		const res = await authenticatedRequest(app, testUser.cookies)
			.get('/api/receivables')
			.expect(200)
			.then(
				(r: {
					body: {
						summary: {
							totalOutstanding: number
							invoiceCount: number
							installmentCount: number
							installmentOutstanding: number
						}
						installmentReceivables: unknown[]
					}
				}) => r.body,
			);

		expect(res.summary.totalOutstanding).toBe(0);
		expect(res.summary.invoiceCount).toBe(0);
		expect(res.summary.installmentCount).toBe(0);
		expect(res.summary.installmentOutstanding).toBe(0);
		expect(res.installmentReceivables).toEqual([]);
	});

	it('GET /receivables — agrège factures avec solde', async () => {
		const invoice = await authenticatedRequest(app, testUser.cookies)
			.post('/api/invoices')
			.send({
				clientId,
				applyClientCredits: false,
				lines: [{ description: 'Prestation', quantity: 1, unitPrice: 100, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string; total: unknown } }) => r.body);

		const total = Number(invoice.total);
		await prisma.invoice.update({
			where: { id: invoice.id },
			data: {
				status: 'SENT',
				balance: total,
				dueDate: new Date('2026-05-01'),
			},
		});

		const res = await authenticatedRequest(app, testUser.cookies)
			.get('/api/receivables')
			.expect(200)
			.then(
				(r: {
					body: {
						summary: { totalOutstanding: number; clientCount: number; invoiceCount: number };
						clients: Array<{ clientId: string; totalBalance: number }>;
						invoices: Array<{ id: string; agingBucket: string; daysPastDue: number }>;
					};
				}) => r.body,
			);

		expect(res.summary.totalOutstanding).toBeCloseTo(total, 2);
		expect(res.summary.clientCount).toBe(1);
		expect(res.summary.invoiceCount).toBe(1);
		expect(res.clients[0].clientId).toBe(clientId);
		expect(res.clients[0].totalBalance).toBeCloseTo(total, 2);
		expect(res.invoices[0].id).toBe(invoice.id);
		expect(res.invoices[0].daysPastDue).toBeGreaterThan(0);
		expect(res.invoices[0].agingBucket).not.toBe('not_due');
	});

	it('GET /receivables — solde après acompte en brouillon', async () => {
		const invoice = await authenticatedRequest(app, testUser.cookies)
			.post('/api/invoices')
			.send({
				clientId,
				applyClientCredits: false,
				lines: [{ description: 'Solde mission', quantity: 1, unitPrice: 450, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string; total: unknown } }) => r.body);

		const total = Number(invoice.total);
		const solNumber = `SOL-TEST-${Date.now()}`;
		await prisma.invoice.update({
			where: { id: invoice.id },
			data: {
				number: solNumber,
				status: 'DRAFT',
				balance: total,
				tags: JSON.stringify(['SOLDE_APRES_ACOMPTE', 'PENDING_EMIT']),
				dueDate: new Date('2026-07-01'),
			},
		});

		const res = await authenticatedRequest(app, testUser.cookies)
			.get('/api/receivables?kind=remainder')
			.expect(200)
			.then(
				(r: {
					body: {
						summary: { invoiceCount: number; byKind: { remainder: number } };
						invoices: Array<{ documentKind: string; number: string }>;
					};
				}) => r.body,
			);

		expect(res.summary.invoiceCount).toBe(1);
		expect(res.summary.byKind.remainder).toBeCloseTo(total, 2);
		expect(res.invoices[0].documentKind).toBe('remainder');
		expect(res.invoices[0].number).toBe(solNumber);
	});
});
