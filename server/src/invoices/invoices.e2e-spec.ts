import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

function uniqueEmail(base: string): string {
	const [local, domain] = base.split('@');
	return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@${domain}`;
}

describe('Invoices e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
		app = moduleRef.createNestApplication();
		await app.init();
		prisma = app.get(PrismaService);
		// On nettoie les entités directement liées aux factures pour isoler les tests,
		// mais on ne supprime plus les clients globaux pour éviter les erreurs de FK
		// avec les autres suites e2e.
		await prisma.$executeRawUnsafe('DELETE FROM QuoteView');
		await prisma.$executeRawUnsafe('DELETE FROM EmailEvent');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteLine');
		await prisma.$executeRawUnsafe('DELETE FROM Quote');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
	});

	afterAll(async () => {
		await app.close();
	});

	// ========================================
	// TESTS UNITAIRES - CRUD BASIQUE
	// ========================================

	it('create invoice then add payment -> status paid', async () => {
		const client = await prisma.client.create({
			data: { name: 'Test Client', email: uniqueEmail('test-invoice@example.com'), isCompany: true, countryCode: 'FR' }
		});

		// CREATE INVOICE
		const invoice = await request(app.getHttpServer())
			.post('/invoices')
			.send({
				clientId: client.id,
				lines: [
					{ description: 'Service A', quantity: 2, unitPrice: 100 },
					{ description: 'Service B', quantity: 1, unitPrice: 50 }
				]
			})
			.expect(201)
			.then(r => r.body);

		expect(invoice.id).toBeDefined();
		expect(invoice.number).toBeDefined();
		expect(invoice.status).toBe('DRAFT');
		expect(Number(invoice.total)).toBe(300); // 2*100 + 1*50 + TVA

		// ADD PAYMENT
		const payment = await request(app.getHttpServer())
			.post(`/invoices/${invoice.id}/payments`)
			.send({ amount: 250, method: 'bank_transfer' })
			.expect(201)
			.then(r => r.body);

		expect(payment.amount).toBe(250);

		// VERIFY STATUS UPDATED
		const updatedInvoice = await request(app.getHttpServer()).get(`/invoices/${invoice.id}`).expect(200).then(r => r.body);
		expect(updatedInvoice.status).toBe('PAID');
		expect(Number(updatedInvoice.balance)).toBe(0);
	});

	// ========================================
	// TESTS D'INTÉGRATION - CALCULS TVA
	// ========================================

	it('VAT calculations and policies', async () => {
		const client = await prisma.client.create({
			data: { name: 'VAT Client', email: uniqueEmail('vat-invoice@test.com'), isCompany: true, countryCode: 'FR' }
		});

		// Test TVA française (20%)
		const invoiceFR = await request(app.getHttpServer())
			.post('/invoices')
			.send({
				clientId: client.id,
				lines: [{ description: 'Service', quantity: 1, unitPrice: 100 }]
			})
			.expect(201)
			.then(r => r.body);

		expect(Number(invoiceFR.subtotal)).toBe(100);
		expect(Number(invoiceFR.tax)).toBe(20); // 20% TVA
		expect(Number(invoiceFR.total)).toBe(120);

		// Test client UE B2B (0% TVA)
		const clientUE = await prisma.client.create({
			data: {
				name: 'UE Client',
				email: uniqueEmail('ue-invoice@test.com'),
				isCompany: true,
				countryCode: 'DE',
				vatNumber: 'DE123456789'
			}
		});
		const invoiceUE = await request(app.getHttpServer())
			.post('/invoices')
			.send({
				clientId: clientUE.id,
				lines: [{ description: 'Service', quantity: 1, unitPrice: 100 }]
			})
			.expect(201)
			.then(r => r.body);

		expect(Number(invoiceUE.subtotal)).toBe(100);
		expect(Number(invoiceUE.tax)).toBe(0); // 0% TVA UE B2B
		expect(Number(invoiceUE.total)).toBe(100);
	});

	// ========================================
	// TESTS DE PERFORMANCE - PDF GÉNÉRATION
	// ========================================

	it('PDF generation', async () => {
		const client = await prisma.client.create({
			data: { name: 'PDF Client INV', email: uniqueEmail('pdf-inv@test.com'), isCompany: true, countryCode: 'FR' }
		});
		const invoice = await request(app.getHttpServer())
			.post('/invoices')
			.send({ clientId: client.id, lines: [{ description: 'Service', quantity: 2, unitPrice: 150 }] })
			.expect(201)
			.then(r => r.body);

		const res = await request(app.getHttpServer()).get(`/invoices/${invoice.id}/pdf`).buffer(true).parse((res, cb) => {
			const data: Uint8Array[] = [];
			res.on('data', (chunk) => data.push(chunk));
			res.on('end', () => cb(null, Buffer.concat(data)));
		}).expect(200);

		expect(res.headers['content-type']).toContain('application/pdf');
		expect((res.body as Buffer).length).toBeGreaterThan(0);
	});

	// ========================================
	// TESTS DE VALIDATION - ERREURS
	// ========================================

	it('validation errors', async () => {
		const client = await prisma.client.create({
			data: { name: 'Test Client', email: uniqueEmail('test-invoice2@example.com'), isCompany: true, countryCode: 'FR' }
		});

		// Client inexistant
		await request(app.getHttpServer())
			.post('/invoices')
			.send({
				clientId: 99999,
				lines: [{ description: 'Service', quantity: 1, unitPrice: 100 }]
			})
			.expect(500); // Foreign key constraint violation

		// Lignes vides
		await request(app.getHttpServer())
			.post('/invoices')
			.send({
				clientId: client.id,
				lines: []
			})
			.expect(400);

		// Prix négatif
		await request(app.getHttpServer())
			.post('/invoices')
			.send({
				clientId: client.id,
				lines: [{ description: 'Service', quantity: 1, unitPrice: -100 }]
			})
			.expect(400);
	});
});
