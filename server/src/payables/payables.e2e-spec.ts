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
		testUser = await createTestUser(app, prisma, { saasPlan: 'PRO' });
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

	it('GET /payables/debts — dossiers brouillons et envoyés', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Dossiers' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Brouillon', totalAmount: 10 })
			.expect(201);

		const sentDebt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Envoyée', totalAmount: 20 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${sentDebt.id}/send`)
			.send({ email: 'dossier@test.local' })
			.expect(201);

		const brouillons = await authenticatedRequest(app, testUser.cookies)
			.get('/api/payables/debts?folder=brouillons&includeFolderCounts=true')
			.expect(200)
			.then(
				(r: {
					body: {
						debts: Array<{ label: string }>;
						folderCounts: { brouillons: number; envoyes: number };
					};
				}) => r.body,
			);

		expect(brouillons.debts).toHaveLength(1);
		expect(brouillons.debts[0].label).toBe('Brouillon');
		expect(brouillons.folderCounts.brouillons).toBe(1);
		expect(brouillons.folderCounts.envoyes).toBe(1);
	});

	it('compta — achat OD à l’envoi et paiement BQ 401/512', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Fournisseur compta', email: 'fournisseur.compta@test.local' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Facture fournisseur', totalAmount: 120 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/send`)
			.send({ email: 'fournisseur.compta@test.local' })
			.expect(201);

		const purchase = await prisma.journalEntry.findFirst({
			where: { reference: `ACHAT DET-${debt.id}` },
			include: { lines: { include: { account: true } }, journal: true },
		});
		expect(purchase).toBeTruthy();
		expect(purchase!.journal.code).toBe('OD');
		expect(purchase!.lines.map((l) => l.account.code).sort()).toEqual(['401', '622'].sort());
		const credit401 = purchase!.lines.find((l) => l.account.code === '401')!.credit;
		expect(Number((credit401 as { toNumber?: () => number })?.toNumber?.() ?? credit401)).toBe(120);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 50, method: 'Virement' })
			.expect(201);

		const paymentRow = await prisma.payableDebtPayment.findFirst({
			where: { debtId: debt.id },
			orderBy: { id: 'desc' },
		});
		expect(paymentRow).toBeTruthy();

		const paymentEntry = await prisma.journalEntry.findFirst({
			where: { reference: `PAIEMENT DET-${debt.id}#${paymentRow!.id}` },
			include: { lines: { include: { account: true } }, journal: true },
		});
		expect(paymentEntry).toBeTruthy();
		expect(paymentEntry!.journal.code).toBe('BQ');
		expect(paymentEntry!.lines.map((l) => l.account.code).sort()).toEqual(['401', '512'].sort());
	});

	it('compta — paiement sans envoi déclenche l’achat puis le règlement', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Famille compta' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Prêt sans envoi', totalAmount: 164.52 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 50 })
			.expect(201);

		const purchase = await prisma.journalEntry.findFirst({
			where: { reference: `ACHAT DET-${debt.id}` },
		});
		expect(purchase).toBeTruthy();

		const paymentRow = await prisma.payableDebtPayment.findFirst({
			where: { debtId: debt.id },
		});
		const paymentEntry = await prisma.journalEntry.findFirst({
			where: { reference: `PAIEMENT DET-${debt.id}#${paymentRow!.id}` },
		});
		expect(paymentEntry).toBeTruthy();
	});

	it('compta — annulation partielle : solde 401/622', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Partiel annul' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'Dette partielle', totalAmount: 100 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/payments`)
			.send({ amount: 30 })
			.expect(201);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/cancel`)
			.expect(201);

		const cancelRemaining = await prisma.journalEntry.findFirst({
			where: { reference: `ANNUL SOLDE ACHAT DET-${debt.id}` },
			include: { lines: { include: { account: true } } },
		});
		expect(cancelRemaining).toBeTruthy();
		expect(cancelRemaining!.lines.map((l) => l.account.code).sort()).toEqual(['401', '622'].sort());
	});

	it('compta — annulation contre-passe l’achat si aucun paiement', async () => {
		const creditor = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/creditors')
			.send({ name: 'Annul compta', email: 'annul.compta@test.local' })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		const debt = await authenticatedRequest(app, testUser.cookies)
			.post('/api/payables/debts')
			.send({ creditorId: creditor.id, label: 'À annuler compta', totalAmount: 80 })
			.expect(201)
			.then((r: { body: { id: number } }) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/send`)
			.send({ email: 'annul.compta@test.local' })
			.expect(201);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/payables/debts/${debt.id}/cancel`)
			.expect(201);

		const cancelEntry = await prisma.journalEntry.findFirst({
			where: { reference: `ANNUL ACHAT DET-${debt.id}` },
		});
		expect(cancelEntry).toBeTruthy();
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
