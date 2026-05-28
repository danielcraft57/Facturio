import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';
import { generateEntityId } from '../common/entity-id';

describe('Clients finance e2e', () => {
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
	});

	afterAll(async () => {
		await app.close();
	});

	async function purgeOrgFinanceData(organizationId: number) {
		await prisma.refund.deleteMany({ where: { invoice: { organizationId } } });
		await prisma.avoirApplication.deleteMany({ where: { avoir: { organizationId } } });
		await prisma.avoirLine.deleteMany({ where: { avoir: { organizationId } } });
		await prisma.avoir.deleteMany({ where: { organizationId } });
		await prisma.payment.deleteMany({ where: { invoice: { organizationId } } });
		await prisma.invoiceLine.deleteMany({ where: { invoice: { organizationId } } });
		await prisma.invoice.deleteMany({ where: { organizationId } });
		await prisma.quoteView.deleteMany({ where: { quote: { organizationId } } });
		await prisma.emailEvent.deleteMany({
			where: { OR: [{ invoice: { organizationId } }, { quote: { organizationId } }] },
		});
		await prisma.quoteLine.deleteMany({ where: { quote: { organizationId } } });
		await prisma.quote.deleteMany({ where: { organizationId } });
		await prisma.client.deleteMany({ where: { organizationId } });
	}

	beforeEach(async () => {
		await purgeOrgFinanceData(testUser.organizationId);

		const client = await prisma.client.create({
			data: {
				id: generateEntityId(),
				name: 'Finance Client',
				email: `finance-${Date.now()}@test.com`,
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		});
		clientId = client.id;
	});

	async function createSentInvoice(
		cid: string,
		opts?: { applyClientCredits?: boolean },
	): Promise<{ id: string; total: number }> {
		const invoice = await authenticatedRequest(app, testUser.cookies)
			.post('/api/invoices')
			.send({
				clientId: cid,
				applyClientCredits: opts?.applyClientCredits ?? false,
				lines: [{ description: 'Prestation test', quantity: 1, unitPrice: 200, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string; total: unknown } }) => r.body);

		await prisma.invoice.update({
			where: { id: invoice.id },
			data: { status: 'SENT', balance: Number(invoice.total) },
		});

		return { id: invoice.id, total: Number(invoice.total) };
	}

	it('GET /clients/:id/finance — synthèse vide pour un client sans mouvement', async () => {
		const finance = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/clients/${clientId}/finance`)
			.expect(200)
			.then((r: { body: Record<string, unknown> }) => r.body);

		expect(finance.balances).toMatchObject({
			totalInvoicedTtc: 0,
			outstandingBalance: 0,
			totalCreditsAvailable: 0,
			totalPaidNet: 0,
		});
		expect(finance.invoiceCount).toBe(0);
		expect(finance.quoteCount).toBe(0);
		expect(finance.movements).toEqual([]);
		expect(finance.openInvoices).toEqual([]);
	});

	it('GET /factures?clientId — filtre les factures par client', async () => {
		const other = await prisma.client.create({
			data: {
				id: generateEntityId(),
				name: 'Autre client',
				email: `other-${Date.now()}@test.com`,
				isCompany: true,
				organizationId: testUser.organizationId,
			},
		});

		const mine = await createSentInvoice(clientId);
		await createSentInvoice(other.id);

		const list = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/factures?clientId=${clientId}&limit=50`)
			.expect(200)
			.then((r: { body: { invoices: { id: string }[] } }) => r.body);

		expect(list.invoices.length).toBe(1);
		expect(list.invoices[0].id).toBe(mine.id);
	});

	it('GET /devis?clientId — filtre les devis par client', async () => {
		const other = await prisma.client.create({
			data: {
				id: generateEntityId(),
				name: 'Autre devis',
				email: `devis-other-${Date.now()}@test.com`,
				isCompany: true,
				organizationId: testUser.organizationId,
			},
		});

		await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({
				clientId,
				lines: [{ description: 'Devis A', quantity: 1, unitPrice: 100, taxRate: 0.2 }],
			})
			.expect(201);

		await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({
				clientId: other.id,
				lines: [{ description: 'Devis B', quantity: 1, unitPrice: 50, taxRate: 0.2 }],
			})
			.expect(201);

		const list = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/devis?clientId=${clientId}&limit=50`)
			.expect(200)
			.then((r: { body: { quotes: { clientId: string }[] } }) => r.body);

		expect(list.quotes.length).toBe(1);
		expect(list.quotes[0].clientId).toBe(clientId);
	});

	it('POST /clients/:id/credits — crée un crédit client disponible', async () => {
		const credit = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/clients/${clientId}/credits`)
			.send({ label: 'Geste commercial', amountTtc: 60, notes: 'test e2e' })
			.expect(201)
			.then((r: { body: { id: number; total: unknown } }) => r.body);

		expect(credit.id).toBeDefined();
		expect(Number(credit.total)).toBeCloseTo(60, 2);

		const finance = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/clients/${clientId}/finance`)
			.expect(200)
			.then((r: { body: { balances: { totalCreditsAvailable: number }; avoirs: { id: number }[] } }) => r.body);

		expect(finance.balances.totalCreditsAvailable).toBeCloseTo(60, 2);
		expect(finance.avoirs.some((a: { id: number }) => a.id === credit.id)).toBe(true);
	});

	it('POST /clients/:id/misc-operations — crée une opération diverse (avoir marqué)', async () => {
		const misc = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/clients/${clientId}/misc-operations`)
			.send({ label: 'Ajustement test', amountTtc: 12, kind: 'adjustment' })
			.expect(201)
			.then((r: { body: { id: number; legalMention?: string } }) => r.body);

		expect(misc.legalMention).toMatch(/^OP_DIVERSE:/);

		const finance = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/clients/${clientId}/finance`)
			.expect(200)
			.then((r: { body: { movements: { kind: string }[] } }) => r.body);

		expect(finance.movements.some((m: { kind: string }) => m.kind === 'misc')).toBe(true);
	});

	it('imputation avoir → facture soldée (balance 0, statut PAID)', async () => {
		const { id: invoiceId, total } = await createSentInvoice(clientId);

		const credit = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/clients/${clientId}/credits`)
			.send({ label: 'Crédit imputation', amountTtc: total })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/avoirs/${credit.id}/apply`)
			.send({ invoiceId, amount: total })
			.expect(200);

		const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
		expect(invoice!.status).toBe('PAID');
		expect(Number(invoice!.balance)).toBeLessThanOrEqual(0.01);

		const finance = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/clients/${clientId}/finance`)
			.expect(200)
			.then(
				(r: {
					body: {
						balances: { outstandingBalance: number; totalCreditsApplied: number };
						movements: { kind: string }[];
					};
				}) => r.body,
			);

		expect(finance.balances.outstandingBalance).toBeLessThanOrEqual(0.01);
		expect(finance.balances.totalCreditsApplied).toBeCloseTo(total, 2);
		expect(
			finance.movements.some((m: { kind: string }) => m.kind === 'credit_applied'),
		).toBe(true);
	});

	it('applyClientCredits à la création — impute automatiquement les crédits libres', async () => {
		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/clients/${clientId}/credits`)
			.send({ label: 'Auto', amountTtc: 240 })
			.expect(201);

		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/invoices')
			.send({
				clientId,
				applyClientCredits: true,
				lines: [{ description: 'Auto imputation', quantity: 1, unitPrice: 200, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string; balance: unknown; status: string } }) => r.body);

		expect(Number(created.balance)).toBeLessThanOrEqual(0.01);
		expect(created.status).toBe('PAID');
	});

	it('GET /clients/:id/finance — 404 pour un client hors organisation', async () => {
		const outsider = await prisma.client.create({
			data: {
				id: generateEntityId(),
				name: 'Hors org',
				email: `outsider-${Date.now()}@test.com`,
				isCompany: true,
				organizationId: null,
			},
		});

		await authenticatedRequest(app, testUser.cookies)
			.get(`/api/clients/${outsider.id}/finance`)
			.expect(404);
	});

	it('POST /clients/:id/credits — rejette un montant invalide', async () => {
		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/clients/${clientId}/credits`)
			.send({ label: 'Bad', amountTtc: 0 })
			.expect(400);
	});
});
