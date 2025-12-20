import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

function uniqueEmail(base: string): string {
	const [local, domain] = base.split('@');
	return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@${domain}`;
}

describe('Payments e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testClientId: number;
	let testInvoiceId: number;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule]
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();

		prisma = app.get(PrismaService);

		// Nettoyage des paiements et factures de test
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');

		// Créer un client de test
		const client = await prisma.client.create({
			data: {
				name: 'Test Client Payment',
				email: uniqueEmail('payment-test@example.com'),
				isCompany: true,
				countryCode: 'FR'
			}
		});
		testClientId = client.id;

		// Créer une facture de test
		const invoice = await prisma.invoice.create({
			data: {
				number: `TEST-PAY-${Date.now()}`,
				clientId: testClientId,
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
						total: 1200
					}
				}
			}
		});
		testInvoiceId = invoice.id;
	});

	afterAll(async () => {
		// Nettoyage
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
		await prisma.$executeRawUnsafe('DELETE FROM Client WHERE id = ?', testClientId);
		await app.close();
	});

	it('create -> list -> get -> update -> delete', async () => {
		// CREATE
		const created = await request(app.getHttpServer())
			.post('/payments')
			.send({
				invoiceId: testInvoiceId,
				amount: 500,
				method: 'Carte bancaire',
				notes: 'Paiement test'
			})
			.expect(201)
			.then((r) => r.body);

		expect(created.id).toBeDefined();
		expect(created.amount).toBe(500);
		expect(created.invoiceId).toBe(testInvoiceId);

		// LIST
		const list = await request(app.getHttpServer())
			.get(`/payments?invoiceId=${testInvoiceId}`)
			.expect(200)
			.then((r) => r.body);

		expect(Array.isArray(list)).toBe(true);
		expect(list.length).toBeGreaterThanOrEqual(1);
		const found = list.find((p: any) => p.id === created.id);
		expect(found).toBeDefined();

		// GET
		const retrieved = await request(app.getHttpServer())
			.get(`/payments/${created.id}`)
			.expect(200)
			.then((r) => r.body);

		expect(retrieved.id).toBe(created.id);
		expect(retrieved.amount).toBe(500);

		// UPDATE
		const updated = await request(app.getHttpServer())
			.patch(`/payments/${created.id}`)
			.send({ amount: 600, notes: 'Paiement modifié' })
			.expect(200)
			.then((r) => r.body);

		expect(updated.amount).toBe(600);
		expect(updated.notes).toBe('Paiement modifié');

		// DELETE
		await request(app.getHttpServer()).delete(`/payments/${created.id}`).expect(200);

		// Vérifier qu'il n'existe plus
		await request(app.getHttpServer()).get(`/payments/${created.id}`).expect(404);
	});

	it('should not allow payment exceeding invoice balance', async () => {
		await request(app.getHttpServer())
			.post('/payments')
			.send({
				invoiceId: testInvoiceId,
				amount: 2000 // Plus que le total de la facture
			})
			.expect(400);
	});

	it('returns 404 for unknown payment', async () => {
		await request(app.getHttpServer()).get('/payments/999999').expect(404);
	});
});

