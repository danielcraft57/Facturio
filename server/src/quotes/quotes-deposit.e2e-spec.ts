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
import { parseTagsJson } from '../common/document-folder.util';

const mockStripeService = {
	isOrgStripeConfigured: () => true,
	createPaymentIntentForInvoice: jest.fn().mockResolvedValue({
		clientSecret: 'pi_test_deposit_e2e',
		amount: 100,
		currency: 'EUR',
		stripePublishableKey: 'pk_test_e2e_facturio',
	}),
	handleOrgWebhook: jest.fn().mockResolvedValue({ received: true }),
	fulfillPaymentIntent: jest.fn(),
};

function uniqueEmail(base: string): string {
	const [local, domain] = base.split('@');
	return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@${domain}`;
}

function lineAmount(line: { debit: unknown; credit: unknown }): number {
	const d = Number((line.debit as { toNumber?: () => number })?.toNumber?.() ?? line.debit ?? 0);
	const c = Number((line.credit as { toNumber?: () => number })?.toNumber?.() ?? line.credit ?? 0);
	return d > 0 ? d : c;
}

describe('Quotes deposit e2e', () => {
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

		await prisma.$executeRawUnsafe('DELETE FROM JournalLine');
		await prisma.$executeRawUnsafe('DELETE FROM JournalEntry');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteView');
		await prisma.$executeRawUnsafe('DELETE FROM EmailEvent');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteLine');
		await prisma.$executeRawUnsafe('DELETE FROM Quote');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Refund');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceInstallment');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirApplication');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirLine');
		await prisma.$executeRawUnsafe('DELETE FROM Avoir');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
	});

	afterAll(async () => {
		await app.close();
	});

	async function ensureStripeConfigured(organizationId: number) {
		await prisma.organization.update({
			where: { id: organizationId },
			data: {
				invoiceStripeSecretKey: 'sk_test_e2e_facturio',
				invoiceStripePublishableKey: 'pk_test_e2e_facturio',
			},
		});
	}

	async function createSentQuote(totalHt = 100, taxRate = 0.2) {
		const client = await prisma.client.create({
			data: {
				id: generateEntityId(),
				name: 'Deposit Client',
				email: uniqueEmail('deposit@test.com'),
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		});
		const quote = await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({
				clientId: client.id,
				lines: [{ description: 'Prestation test', quantity: 1, unitPrice: totalHt, taxRate }],
			})
			.expect(201)
			.then((r: { body: { id: string; number: string; total: number } }) => r.body);

		const sendRes = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/quotes/${quote.id}/send`)
			.expect(201)
			.then((r: { body: { publicUrl: string } }) => r.body);

		const token = String(sendRes.publicUrl).split('/').filter(Boolean).pop()!;
		return { client, quote, token };
	}

	it('accept-pay DEPOSIT: factures ACO + SOL, VE sur acompte uniquement, paiement 512/411', async () => {
		await ensureStripeConfigured(testUser.organizationId);
		const { quote, token } = await createSentQuote(100, 0.2);
		const quoteTotal = Number(quote.total);

		const acceptRes = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'DEPOSIT', depositRate: 0.1 })
			.expect(201)
			.then((r: { body: { depositInvoiceToken?: string; depositInvoiceNumber?: string } }) => r.body);

		expect(acceptRes.depositInvoiceToken).toBeTruthy();
		expect(acceptRes.depositInvoiceNumber).toMatch(/^ACO-/);

		const deposit = await prisma.invoice.findFirst({
			where: { number: acceptRes.depositInvoiceNumber! },
			include: { lines: true },
		});
		expect(deposit).toBeTruthy();
		expect(deposit!.tags).toContain('ACOMPTE_10');
		expect(deposit!.sentAt).toBeTruthy();
		expect(deposit!.status).toBe('SENT');
		expect(Number(deposit!.total)).toBeCloseTo(quoteTotal * 0.1, 1);
		expect(Number(deposit!.subtotal) + Number(deposit!.tax)).toBeCloseTo(Number(deposit!.total), 2);

		const remainder = await prisma.invoice.findFirst({
			where: {
				organizationId: testUser.organizationId,
				tags: { contains: 'SOLDE_APRES_ACOMPTE' },
			},
		});
		expect(remainder).toBeTruthy();
		expect(remainder!.number).toMatch(/^SOL-/);
		expect(remainder!.sentAt).toBeNull();

		const veDeposit = await prisma.journalEntry.findFirst({
			where: { reference: `VENTE ${deposit!.number}`, journal: { code: 'VE' } },
			include: { lines: { include: { account: true } } },
		});
		expect(veDeposit).toBeTruthy();
		const codes = veDeposit!.lines.map((l) => l.account.code);
		expect(codes).toContain('411');
		expect(codes).toContain('706');
		expect(codes).toContain('44571');
		const debit411 = veDeposit!.lines.find((l) => l.account.code === '411');
		const credit706 = veDeposit!.lines.find((l) => l.account.code === '706');
		const credit44571 = veDeposit!.lines.find((l) => l.account.code === '44571');
		expect(lineAmount(debit411!)).toBeCloseTo(Number(deposit!.total), 2);
		expect(lineAmount(credit706!)).toBeCloseTo(Number(deposit!.subtotal), 2);
		expect(lineAmount(credit44571!)).toBeCloseTo(Number(deposit!.tax), 2);

		const veRemainder = await prisma.journalEntry.findFirst({
			where: { reference: `VENTE ${remainder!.number}` },
		});
		expect(veRemainder).toBeNull();

		const payAmount = Number(deposit!.total);
		const paymentRes = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/invoices/${deposit!.id}/payments`)
			.send({ amount: payAmount, method: 'bank_transfer', date: new Date().toISOString().split('T')[0] })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const payEntry = await prisma.journalEntry.findFirst({
			where: {
				reference: `PAIEMENT ${deposit!.number}#${paymentRes.id}`,
				journal: { code: 'BQ' },
			},
			include: { lines: { include: { account: true } } },
		});
		expect(payEntry).toBeTruthy();
		const payCodes = payEntry!.lines.map((l) => l.account.code);
		expect(payCodes).toContain('512');
		expect(payCodes).toContain('411');

		const remainderAfterPay = await prisma.invoice.findFirst({
			where: {
				organizationId: testUser.organizationId,
				tags: { contains: 'SOLDE_APRES_ACOMPTE' },
			},
		});
		expect(remainderAfterPay?.status).toBe('DRAFT');
		expect(remainderAfterPay?.sentAt).toBeNull();

		const solLinkRes = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'DEPOSIT', depositRate: 0.1 })
			.expect(201)
			.then((r: { body: { remainderInvoiceToken?: string } }) => r.body);
		expect(solLinkRes.remainderInvoiceToken).toBeTruthy();

		const remainderAfterSolLink = await prisma.invoice.findFirst({
			where: { id: remainderAfterPay!.id },
		});
		expect(remainderAfterSolLink?.status).toBe('DRAFT');
		expect(remainderAfterSolLink?.sentAt).toBeNull();
		expect(remainderAfterSolLink?.publicToken).toBeTruthy();

		await request(app.getHttpServer())
			.get(`/api/public/invoices/${solLinkRes.remainderInvoiceToken}`)
			.expect(200);

		const remainderId = remainderAfterPay!.id;
		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/invoices/${remainderId}/send`)
			.send({ email: 'client-sol@test.local' })
			.expect(201);

		const remainderSent = await prisma.invoice.findUnique({ where: { id: remainderId } });
		expect(remainderSent?.status).toBe('SENT');
		expect(remainderSent?.sentAt).toBeTruthy();
		const sentEvents = await prisma.emailEvent.count({
			where: { invoiceId: remainderId, type: 'sent' },
		});
		expect(sentEvents).toBeGreaterThan(0);

		const afterReload = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/invoices/${remainderId}`)
			.expect(200)
			.then((r: { body: { status?: string; sentAt?: string | null } }) => r.body);
		expect(afterReload.status).toBe('SENT');
		expect(afterReload.sentAt).toBeTruthy();

		const remainderPublicToken = remainderSent!.publicToken!;
		await request(app.getHttpServer())
			.get(`/api/public/invoices/${remainderPublicToken}/checkout`)
			.expect(200);
	});

	it('accept-pay FULL: facture FAC unique et écriture VE 411/706/44571', async () => {
		await ensureStripeConfigured(testUser.organizationId);
		const { quote, token } = await createSentQuote(200, 0.2);

		const acceptRes = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'FULL' })
			.expect(201)
			.then((r: { body: { invoiceToken?: string; invoiceNumber?: string } }) => r.body);

		expect(acceptRes.invoiceToken).toBeTruthy();
		expect(acceptRes.invoiceNumber).toMatch(/^FAC-/);

		const invoice = await prisma.invoice.findFirst({
			where: { number: acceptRes.invoiceNumber! },
		});
		expect(invoice?.sourceQuoteId).toBe(quote.id);

		const ve = await prisma.journalEntry.findFirst({
			where: { reference: `VENTE ${invoice!.number}`, journal: { code: 'VE' } },
			include: { lines: { include: { account: true } } },
		});
		expect(ve).toBeTruthy();
		expect(ve!.lines.map((l) => l.account.code).sort()).toEqual(['411', '44571', '706'].sort());
	});

	it('accept-pay FULL est idempotent si la facture existe déjà', async () => {
		await ensureStripeConfigured(testUser.organizationId);
		const { quote, token } = await createSentQuote(50, 0.2);

		const first = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'FULL' })
			.expect(201)
			.then((r: { body: { invoiceNumber?: string } }) => r.body);

		const second = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'FULL' })
			.expect(201)
			.then((r: { body: { invoiceNumber?: string } }) => r.body);

		expect(first.invoiceNumber).toMatch(/^FAC-/);
		expect(second.invoiceNumber).toBe(first.invoiceNumber);

		const facForQuote = await prisma.invoice.count({
			where: { sourceQuoteId: quote.id, number: { startsWith: 'FAC-' } },
		});
		expect(facForQuote).toBe(1);
	});

	it('public: refuser puis accepter (accept-pay) est interdit', async () => {
		await ensureStripeConfigured(testUser.organizationId);
		const { token } = await createSentQuote(100, 0.2);

		await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/reject`)
			.expect(201);

		await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'FULL' })
			.expect(400);
	});

	it('public: accepter (accept-pay) puis refuser est interdit', async () => {
		await ensureStripeConfigured(testUser.organizationId);
		const { token } = await createSentQuote(100, 0.2);

		await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'FULL' })
			.expect(201);

		await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/reject`)
			.expect(400);
	});

	it('GET public quote — expose le paiement en plusieurs fois dès 600 € TTC', async () => {
		await ensureStripeConfigured(testUser.organizationId);
		const { token } = await createSentQuote(500, 0.2);

		const view = await request(app.getHttpServer())
			.get(`/api/public/quotes/${token}`)
			.expect(200)
			.then(
				(r: {
					body: {
						publicPaymentHints: {
							smartInstallment: { eligible: boolean; count: number; preview: unknown[] } | null;
						};
					};
				}) => r.body,
			);

		expect(view.publicPaymentHints.smartInstallment?.eligible).toBe(true);
		expect(view.publicPaymentHints.smartInstallment?.count).toBe(2);
		expect(view.publicPaymentHints.smartInstallment?.preview.length).toBe(2);
	});

	it('accept-pay INSTALLMENT sans acompte — ECH en brouillon, mensualités programmées', async () => {
		await ensureStripeConfigured(testUser.organizationId);
		const { token, quote } = await createSentQuote(500, 0.2);
		const total = Number(quote.total);

		const accept = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'INSTALLMENT', withDeposit: false })
			.expect(201)
			.then(
				(r: {
					body: {
						status: string;
						invoiceToken: string;
						invoiceNumber: string;
						initialPaymentAmount: number;
						installmentCount: number;
					};
				}) => r.body,
			);

		expect(accept.status).toBe('accepted');
		expect(accept.invoiceNumber).toMatch(/^ECH-/);
		expect(accept.installmentCount).toBeGreaterThanOrEqual(2);

		const installment = await prisma.invoice.findFirst({
			where: { number: accept.invoiceNumber },
			include: { installments: { orderBy: { sequence: 'asc' } } },
		});
		expect(installment?.status).toBe('DRAFT');
		expect(parseTagsJson(installment!.tags)).toContain('PENDING_EMIT');
		expect(installment!.installments!.every((row) => row.status === 'SCHEDULED')).toBe(true);

		const echSum = installment!.installments!.reduce(
			(s, row) => s + Number((row.amount as any)?.toNumber?.() ?? row.amount),
			0,
		);
		expect(echSum).toBeCloseTo(total, 2);

		const reset = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/reset-payment-choice`)
			.expect(201)
			.then((r: { body: { ok: boolean } }) => r.body);
		expect(reset.ok).toBe(true);

		const afterReset = await prisma.invoice.findFirst({
			where: { number: accept.invoiceNumber },
		});
		expect(afterReset?.status).toBe('CANCELLED');

		const view = await request(app.getHttpServer())
			.get(`/api/public/quotes/${token}`)
			.expect(200)
			.then((r: { body: { publicPaymentHints: { hasInstallmentInvoice: boolean; canResetPaymentChoice: boolean } } }) => r.body);
		expect(view.publicPaymentHints.hasInstallmentInvoice).toBe(false);
		expect(view.publicPaymentHints.canResetPaymentChoice).toBe(false);

		const reaccept = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'INSTALLMENT', withDeposit: true, depositRate: 0.1 })
			.expect(201)
			.then((r: { body: { depositInvoiceNumber: string; installmentInvoiceNumber: string } }) => r.body);
		expect(reaccept.depositInvoiceNumber).toMatch(/^ACO-/);
		expect(reaccept.installmentInvoiceNumber).toMatch(/^ECH-/);
	});

	it('accept-pay INSTALLMENT avec acompte — ACO + ECH, acompte non compté comme mensualité', async () => {
		await ensureStripeConfigured(testUser.organizationId);
		const { token, quote } = await createSentQuote(500, 0.2);
		const total = Number(quote.total);

		const accept = await request(app.getHttpServer())
			.post(`/api/public/quotes/${token}/accept-pay`)
			.send({ mode: 'INSTALLMENT', withDeposit: true, depositRate: 0.1 })
			.expect(201)
			.then(
				(r: {
					body: {
						status: string;
						depositInvoiceToken: string;
						depositInvoiceNumber: string;
						installmentInvoiceNumber: string;
						initialPaymentAmount: number;
						installmentCount: number;
						withDeposit: boolean;
					};
				}) => r.body,
			);

		expect(accept.status).toBe('accepted');
		expect(accept.depositInvoiceNumber).toMatch(/^ACO-/);
		expect(accept.installmentInvoiceNumber).toMatch(/^ECH-/);
		expect(accept.withDeposit).toBe(true);
		expect(accept.initialPaymentAmount).toBeCloseTo(total * 0.1, 2);
		expect(accept.installmentCount).toBeGreaterThanOrEqual(2);

		const deposit = await prisma.invoice.findFirst({
			where: { number: accept.depositInvoiceNumber },
			include: { installments: true, payments: true },
		});
		const installment = await prisma.invoice.findFirst({
			where: { number: accept.installmentInvoiceNumber },
			include: { installments: { orderBy: { sequence: 'asc' } } },
		});

		expect(deposit?.installments?.length ?? 0).toBe(0);
		expect(deposit?.status).toBe('DRAFT');
		expect(installment?.status).toBe('DRAFT');
		expect(installment?.installments?.length).toBe(accept.installmentCount);
		const echSum = installment!.installments!.reduce(
			(s, row) => s + Number((row.amount as any)?.toNumber?.() ?? row.amount),
			0,
		);
		expect(echSum).toBeCloseTo(total * 0.9, 2);
		const firstInstallment = Number(
			(installment!.installments![0].amount as any)?.toNumber?.() ??
				installment!.installments![0].amount,
		);
		const depositAmount = total * 0.1;
		const equalFirst = total / accept.installmentCount;
		expect(firstInstallment).toBeCloseTo(equalFirst - depositAmount, 2);
		expect(installment!.installments!.every((row) => row.status === 'SCHEDULED')).toBe(true);

		const veDeposit = await prisma.journalEntry.findFirst({
			where: { reference: `VENTE ${deposit!.number}`, journal: { code: 'VE' } },
		});
		expect(veDeposit).toBeNull();
	});

	describe('reset-payment-choice — changements et blocages après paiement', () => {
		async function publicHints(token: string) {
			return request(app.getHttpServer())
				.get(`/api/public/quotes/${token}`)
				.expect(200)
				.then(
					(r: {
						body: {
							publicPaymentHints: {
								canResetPaymentChoice?: boolean;
								hasInstallmentInvoice?: boolean;
								hasDepositSplit?: boolean;
							};
						};
					}) => r.body.publicPaymentHints,
				);
		}

		async function payInvoice(invoiceId: string, amount: number) {
			await authenticatedRequest(app, testUser.cookies)
				.post(`/api/invoices/${invoiceId}/payments`)
				.send({ amount, method: 'bank_transfer' })
				.expect(201);
		}

		it('canResetPaymentChoice=true tant qu’aucun encaissement (FULL)', async () => {
			await ensureStripeConfigured(testUser.organizationId);
			const { token } = await createSentQuote(400, 0.2);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'FULL' })
				.expect(201);

			const hints = await publicHints(token);
			expect(hints.canResetPaymentChoice).toBe(true);
		});

		it('reset puis passage FULL → INSTALLMENT sans acompte', async () => {
			await ensureStripeConfigured(testUser.organizationId);
			const { token } = await createSentQuote(500, 0.2);

			const full = await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'FULL' })
				.expect(201)
				.then((r: { body: { invoiceNumber?: string } }) => r.body);
			expect(full.invoiceNumber).toMatch(/^FAC-/);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/reset-payment-choice`)
				.expect(201);

			const installment = await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'INSTALLMENT', withDeposit: false })
				.expect(201)
				.then((r: { body: { invoiceNumber?: string } }) => r.body);
			expect(installment.invoiceNumber).toMatch(/^ECH-/);

			const hints = await publicHints(token);
			expect(hints.hasInstallmentInvoice).toBe(true);
			expect(hints.canResetPaymentChoice).toBe(true);
		});

		it('reset puis passage INSTALLMENT sans acompte → FULL', async () => {
			await ensureStripeConfigured(testUser.organizationId);
			const { token, quote } = await createSentQuote(500, 0.2);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'INSTALLMENT', withDeposit: false })
				.expect(201);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/reset-payment-choice`)
				.expect(201);

			const full = await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'FULL' })
				.expect(201)
				.then((r: { body: { invoiceNumber?: string } }) => r.body);
			expect(full.invoiceNumber).toMatch(/^FAC-/);

			const fac = await prisma.invoice.findFirst({
				where: { sourceQuoteId: quote.id, status: { not: 'CANCELLED' } },
			});
			expect(fac?.number).toMatch(/^FAC-/);
		});

		it('reset puis passage INSTALLMENT+acompte → DEPOSIT classique', async () => {
			await ensureStripeConfigured(testUser.organizationId);
			const { token } = await createSentQuote(500, 0.2);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'INSTALLMENT', withDeposit: true, depositRate: 0.1 })
				.expect(201);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/reset-payment-choice`)
				.expect(201);

			const deposit = await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'DEPOSIT', depositRate: 0.1 })
				.expect(201)
				.then((r: { body: { depositInvoiceNumber?: string; remainderInvoiceNumber?: string } }) => r.body);
			expect(deposit.depositInvoiceNumber).toMatch(/^ACO-/);
			expect(deposit.remainderInvoiceNumber).toMatch(/^SOL-/);

			const hints = await publicHints(token);
			expect(hints.hasDepositSplit).toBe(true);
			expect(hints.hasInstallmentInvoice).toBeFalsy();
		});

		it('reset sans plan actif — réponse ok', async () => {
			await ensureStripeConfigured(testUser.organizationId);
			const { token } = await createSentQuote(100, 0.2);

			const res = await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/reset-payment-choice`)
				.expect(201)
				.then((r: { body: { ok: boolean; message?: string } }) => r.body);
			expect(res.ok).toBe(true);
			expect(res.message).toMatch(/aucun plan/i);
		});

		it('reset refusé après paiement acompte (INSTALLMENT + acompte)', async () => {
			await ensureStripeConfigured(testUser.organizationId);
			const { token } = await createSentQuote(500, 0.2);

			const accept = await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'INSTALLMENT', withDeposit: true, depositRate: 0.1 })
				.expect(201)
				.then((r: { body: { depositInvoiceNumber?: string } }) => r.body);

			const deposit = await prisma.invoice.findFirst({
				where: { number: accept.depositInvoiceNumber! },
			});
			await payInvoice(deposit!.id, Number(deposit!.total));

			const hints = await publicHints(token);
			expect(hints.canResetPaymentChoice).toBe(false);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/reset-payment-choice`)
				.expect(400);
		});

		it('reset refusé après paiement facture FULL', async () => {
			await ensureStripeConfigured(testUser.organizationId);
			const { token } = await createSentQuote(200, 0.2);

			const accept = await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'FULL' })
				.expect(201)
				.then((r: { body: { invoiceNumber?: string } }) => r.body);

			const invoice = await prisma.invoice.findFirst({
				where: { number: accept.invoiceNumber! },
			});
			await payInvoice(invoice!.id, Number(invoice!.total));

			const hints = await publicHints(token);
			expect(hints.canResetPaymentChoice).toBe(false);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/reset-payment-choice`)
				.expect(400);
		});

		it('reset refusé après encaissement partiel sur échéancier ECH', async () => {
			await ensureStripeConfigured(testUser.organizationId);
			const { token } = await createSentQuote(500, 0.2);

			const accept = await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'INSTALLMENT', withDeposit: false })
				.expect(201)
				.then((r: { body: { invoiceNumber?: string } }) => r.body);

			const ech = await prisma.invoice.findFirst({
				where: { number: accept.invoiceNumber! },
				include: { installments: { orderBy: { sequence: 'asc' } } },
			});
			expect(ech?.installments?.length).toBeGreaterThan(0);

			const firstAmount = Number(
				(ech!.installments![0].amount as { toNumber?: () => number })?.toNumber?.() ??
					ech!.installments![0].amount,
			);
			await payInvoice(ech!.id, firstAmount);

			const hints = await publicHints(token);
			expect(hints.canResetPaymentChoice).toBe(false);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/reset-payment-choice`)
				.expect(400);
		});

		it('reset après DEPOSIT puis accept INSTALLMENT — pas de blocage SOL annulée', async () => {
			await ensureStripeConfigured(testUser.organizationId);
			const { token } = await createSentQuote(500, 0.2);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'DEPOSIT', depositRate: 0.1 })
				.expect(201);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/reset-payment-choice`)
				.expect(201);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'INSTALLMENT', withDeposit: false })
				.expect(201)
				.then((r: { body: { invoiceNumber?: string } }) => r.body)
				.then((body) => {
					expect(body.invoiceNumber).toMatch(/^ECH-/);
				});
		});

		it('reset annule toutes les factures liées (ACO + ECH)', async () => {
			await ensureStripeConfigured(testUser.organizationId);
			const { token } = await createSentQuote(500, 0.2);

			const accept = await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/accept-pay`)
				.send({ mode: 'INSTALLMENT', withDeposit: true, depositRate: 0.1 })
				.expect(201)
				.then(
					(r: {
						body: { depositInvoiceNumber?: string; installmentInvoiceNumber?: string };
					}) => r.body,
				);

			await request(app.getHttpServer())
				.post(`/api/public/quotes/${token}/reset-payment-choice`)
				.expect(201);

			const deposit = await prisma.invoice.findFirst({
				where: { number: accept.depositInvoiceNumber! },
			});
			const installment = await prisma.invoice.findFirst({
				where: { number: accept.installmentInvoiceNumber! },
			});
			expect(deposit?.status).toBe('CANCELLED');
			expect(installment?.status).toBe('CANCELLED');
			expect(deposit?.sourceQuoteId).toBeNull();
		});
	});
});
