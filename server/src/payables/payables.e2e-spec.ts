import * as cookieParser from 'cookie-parser';
import { randomBytes } from 'crypto';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../common/test-helpers/auth.helper';

describe('Payables e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: { cookies: string[]; organizationId: number };

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

	async function purgePayables(organizationId: number) {
		await prisma.payableDebtPayment.deleteMany({ where: { debt: { organizationId } } });
		await prisma.payableDebt.deleteMany({ where: { organizationId } });
		await prisma.payableCreditor.deleteMany({ where: { organizationId } });
	}

	beforeEach(async () => {
		await purgePayables(testUser.organizationId);
	});

	it('GET /payables — vide', async () => {
		const res = await authenticatedRequest(app, testUser.cookies)
			.get('/api/payables')
			.expect(200)
			.then((r: { body: { summary: { totalOutstanding: number } } }) => r.body);

		expect(res.summary.totalOutstanding).toBe(0);
	});

	it('dette familiale — 164,52 € puis paiement partiel 50 €', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Maman' })
			.expect(201)
			.then((r: { body: { id: number; name: string } }) => r.body);

		expect(creditor.name).toBe('Maman');

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({
				creditorId: creditor.id,
				label: 'Prêt personnel',
				totalAmount: 164.52,
			})
			.expect(201)
			.then(
				(r: {
					body: { id: number; balance: number; totalAmount: number; status: string };
				}) => r.body,
			);

		expect(debt.totalAmount).toBe(164.52);
		expect(debt.balance).toBe(164.52);
		expect(debt.status).toBe('OPEN');

		const afterPayment = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 50, method: 'Virement', notes: 'Remboursement partiel' })
			.expect(201)
			.then(
				(r: {
					body: { balance: number; status: string; totalPaid: number };
				}) => r.body,
			);

		expect(afterPayment.totalPaid).toBe(50);
		expect(afterPayment.balance).toBe(114.52);
		expect(afterPayment.status).toBe('PARTIAL');

		const summary = await authenticatedRequest(app, testUser.cookies)
			.get('/api/payables')
			.expect(200)
			.then((r: { body: { summary: { totalOutstanding: number }; debts: unknown[] } }) => r.body);

		expect(summary.summary.totalOutstanding).toBe(114.52);
		expect(summary.debts).toHaveLength(1);

		const detail = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/payables/debts/${debt.id}`)
			.expect(200)
			.then((r: { body: { payments: Array<{ amount: number }> } }) => r.body);

		expect(detail.payments).toHaveLength(1);
		expect(detail.payments[0].amount).toBe(50);
	});

	it('refuse un paiement supérieur au solde', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Créancier test' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Dette', totalAmount: 100 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 150 })
			.expect(400);
	});

	it('annule une dette ouverte sans la supprimer', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Annul test' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'À annuler', totalAmount: 80 })
			.expect(201)
			.then((r: { body: { id: number; status: string } }) => r.body);

		const cancelled = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/cancel`)
			.expect(201)
			.then((r: { body: { status: string; balance: number } }) => r.body);

		expect(cancelled.status).toBe('CANCELLED');
		expect(cancelled.balance).toBe(0);

		const summary = await authenticatedRequest(app, testUser.cookies)
			.get('/api/payables')
			.expect(200)
			.then((r: { body: { debts: unknown[] } }) => r.body);

		expect(summary.debts).toHaveLength(0);
	});

	it('dette soldée reste visible dans le résumé avec statut PAID', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Créancier soldé' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'À solder', totalAmount: 25 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 25 })
			.expect(201);

		const summary = await authenticatedRequest(app, testUser.cookies)
			.get('/api/payables')
			.expect(200)
			.then(
				(r: {
					body: {
						summary: { totalOutstanding: number; debtCount: number };
						debts: Array<{ id: number; status: string; balance: number }>;
					};
				}) => r.body,
			);

		expect(summary.summary.totalOutstanding).toBe(0);
		expect(summary.summary.debtCount).toBe(0);
		expect(summary.debts).toHaveLength(1);
		expect(summary.debts[0].status).toBe('PAID');
		expect(summary.debts[0].balance).toBe(0);
	});

	it('refuse annulation et paiement sur dette soldée', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Soldée test' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Soldée', totalAmount: 40 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 40 })
			.expect(201);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/cancel`)
			.expect(400);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 1 })
			.expect(400);
	});

	it('POST send-payment-notice — remboursement total', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Email créancier', email: 'creancier.pay@test.local' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Notif soldée', totalAmount: 30 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 30 })
			.expect(201);

		const sent = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/send-payment-notice`)
			.send({ paymentAmount: 30 })
			.expect(201)
			.then(
				(r: {
					body: { emailSent: boolean; sentTo: string; fullyPaid: boolean; publicToken: string };
				}) => r.body,
			);

		expect(sent.emailSent).toBe(true);
		expect(sent.sentTo).toBe('creancier.pay@test.local');
		expect(sent.fullyPaid).toBe(true);
		expect(sent.publicToken).toBeTruthy();
	});

	it('POST send-payment-notice — remboursement partiel', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Email partiel', email: 'partiel.pay@test.local' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Notif partielle', totalAmount: 80 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 20 })
			.expect(201);

		const sent = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/send-payment-notice`)
			.send({ paymentAmount: 20 })
			.expect(201)
			.then((r: { body: { fullyPaid: boolean; sentTo: string } }) => r.body);

		expect(sent.fullyPaid).toBe(false);
		expect(sent.sentTo).toBe('partiel.pay@test.local');
	});

	it('POST send-payment-notice — refuse sans email', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Sans email' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Pas mail', totalAmount: 10 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 5 })
			.expect(201);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/send-payment-notice`)
			.send({ paymentAmount: 5 })
			.expect(400);
	});

	it('GET /public/dettes/:token — vue publique sans auth', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Banque' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Prêt', totalAmount: 200 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const publicToken = randomBytes(24).toString('hex');
		await prisma.payableDebt.update({
			where: { id: debt.id },
			data: { publicToken },
		});

		const view = await request(app.getHttpServer())
			.get(`/api/public/dettes/${publicToken}`)
			.expect(200)
			.then(
				(r: {
					body: { label: string; balance: number; creditorName: string; issuerName: string };
				}) => r.body,
			);

		expect(view.label).toBe('Prêt');
		expect(view.balance).toBe(200);
		expect(view.creditorName).toBe('Banque');
		expect(view.issuerName).toBeTruthy();
	});
});
