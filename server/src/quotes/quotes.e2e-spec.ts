import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Quotes e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
		app = moduleRef.createNestApplication();
		app.enableCors({ origin: true, credentials: true });
		await app.init();
		prisma = app.get(PrismaService);
		await prisma.$executeRawUnsafe('DELETE FROM QuoteView');
		await prisma.$executeRawUnsafe('DELETE FROM EmailEvent');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteLine');
		await prisma.$executeRawUnsafe('DELETE FROM Quote');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
		await prisma.$executeRawUnsafe('DELETE FROM Client');
	});

	afterAll(async () => {
		await app.close();
	});

	// ========================================
	// TESTS UNITAIRES - CRUD BASIQUE
	// ========================================

	it('create -> send -> view -> accept', async () => {
		const client = await prisma.client.create({ data: { name: 'Test Client', email: 'test-quote@example.com', isCompany: true, countryCode: 'FR' } });

		// CREATE QUOTE
		const created = await request(app.getHttpServer())
			.post('/quotes')
			.send({ clientId: client.id, lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }] })
			.expect(201)
			.then(r => r.body);

		expect(created.id).toBeDefined();
		expect(created.number).toBeTruthy();

		// SEND QUOTE
		const sendRes = await request(app.getHttpServer()).post(`/quotes/${created.id}/send`).expect(201).then(r => r.body);
		expect(sendRes.publicUrl).toMatch(/public\/quotes\//);
		const token = String(sendRes.publicUrl).split('/').pop()!;

		// VIEW QUOTE (public)
		const viewRes = await request(app.getHttpServer()).get(`/public/quotes/${token}`).expect(200).then(r => r.body);
		expect(viewRes.id).toBe(created.id);

		// ACCEPT QUOTE (public)
		const acceptRes = await request(app.getHttpServer()).post(`/public/quotes/${token}/accept`).expect(201).then(r => r.body);
		expect(acceptRes.status).toBe('accepted');
	});

	// ========================================
	// TESTS D'INTÉGRATION - EMAIL ET WEBHOOKS
	// ========================================

	it('email sending and webhook processing', async () => {
		const client = await prisma.client.create({ data: { name: 'Email Client', email: 'email@test.com', isCompany: true, countryCode: 'FR' } });
		const quote = await request(app.getHttpServer())
			.post('/quotes')
			.send({ clientId: client.id, lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }] })
			.expect(201)
			.then(r => r.body);

		// Send quote (triggers email)
		await request(app.getHttpServer()).post(`/quotes/${quote.id}/send`).expect(201);

		// Simulate email webhook events
		await request(app.getHttpServer())
			.post('/webhooks/email')
			.send({
				quoteId: quote.id,
				type: 'delivered',
				providerId: 'test-123'
			})
			.expect(201);

		await request(app.getHttpServer())
			.post('/webhooks/email')
			.send({
				quoteId: quote.id,
				type: 'opened',
				providerId: 'test-123'
			})
			.expect(201);

		// Verify events stored
		const events = await prisma.emailEvent.findMany({ where: { quoteId: quote.id } });
		expect(events).toHaveLength(2);
		expect(events[0].type).toBe('delivered');
		expect(events[1].type).toBe('opened');
	});

	// ========================================
	// TESTS DE PERFORMANCE - PDF GÉNÉRATION
	// ========================================

	it('PDF generation', async () => {
		const client = await prisma.client.create({ data: { name: 'PDF Client', email: 'pdf@c.test', isCompany: true, countryCode: 'FR' } });
		const quote = await request(app.getHttpServer())
			.post('/quotes')
			.send({ clientId: client.id, lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }] })
			.expect(201)
			.then(r => r.body);

		const res = await request(app.getHttpServer()).get(`/quotes/${quote.id}/pdf`).buffer(true).parse((res, cb) => {
			const data: Uint8Array[] = [];
			res.on('data', (chunk) => data.push(chunk));
			res.on('end', () => cb(null, Buffer.concat(data)));
		}).expect(200);

		expect(res.headers['content-type']).toContain('application/pdf');
		expect((res.body as Buffer).length).toBeGreaterThan(0);
	});

	// ========================================
	// TESTS D'INTÉGRATION - CONVERSION DEVIS
	// ========================================

	it('quote to invoice conversion', async () => {
		const client = await prisma.client.create({ data: { name: 'Convert Client', email: 'convert@test.com', isCompany: true, countryCode: 'FR' } });
		const quote = await request(app.getHttpServer())
			.post('/quotes')
			.send({ clientId: client.id, lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }] })
			.expect(201)
			.then(r => r.body);

		// Convert to invoice
		const invoice = await request(app.getHttpServer())
			.post(`/quotes/${quote.id}/convert-to-invoice`)
			.expect(201)
			.then(r => r.body);

		expect(invoice.id).toBeDefined();
		expect(invoice.number).toBeDefined();
		expect(invoice.clientId).toBe(client.id);
		expect(invoice.lines).toHaveLength(1);
		expect(invoice.lines[0].description).toBe('Service');
	});

	// ========================================
	// TESTS DE VALIDATION - ERREURS
	// ========================================

	it('validation errors', async () => {
		const client = await prisma.client.create({ data: { name: 'Test Client', email: 'test-validation@example.com', isCompany: true, countryCode: 'FR' } });

		// Client inexistant
		await request(app.getHttpServer())
			.post('/quotes')
			.send({
				clientId: 99999,
				lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }]
			})
			.expect(500); // Foreign key constraint violation

		// Lignes vides
		await request(app.getHttpServer())
			.post('/quotes')
			.send({
				clientId: client.id,
				lines: []
			})
			.expect(400);

		// Token invalide
		await request(app.getHttpServer()).get('/public/quotes/invalid-token').expect(404);
	});
});
