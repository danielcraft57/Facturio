import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestUser, authenticatedRequest } from '../../src/common/test-helpers/auth.helper';

function uniqueEmail(base: string): string {
	const [local, domain] = base.split('@');
	return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@${domain}`;
}

describe('Quotes e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: { cookies: string[]; organizationId: number };

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
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

		// Créer un utilisateur de test
		testUser = await createTestUser(app, prisma);
		// On remet à zéro les données liées aux devis / factures / compta,
		// sans supprimer les clients globaux pour ne pas casser les autres tests.
		await prisma.$executeRawUnsafe('DELETE FROM JournalLine');
		await prisma.$executeRawUnsafe('DELETE FROM JournalEntry');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteView');
		await prisma.$executeRawUnsafe('DELETE FROM EmailEvent');
		await prisma.$executeRawUnsafe('DELETE FROM QuoteLine');
		await prisma.$executeRawUnsafe('DELETE FROM Quote');
		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirApplication');
		await prisma.$executeRawUnsafe('DELETE FROM AvoirLine');
		await prisma.$executeRawUnsafe('DELETE FROM Avoir');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');
	});

	afterAll(async () => {
		await app.close();
	});

	// ========================================
	// TESTS UNITAIRES - CRUD BASIQUE
	// ========================================

	it('create -> send -> view -> accept', async () => {
		const client = await prisma.client.create({
			data: { 
				name: 'Test Client', 
				email: uniqueEmail('test-quote@example.com'), 
				isCompany: true, 
				countryCode: 'FR',
				organizationId: testUser.organizationId
			}
		});

		// CREATE QUOTE
		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({ clientId: client.id, organizationId: testUser.organizationId, lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }] })
			.expect(201)
			.then((r: any) => r.body);

		expect(created.id).toBeDefined();
		expect(created.number).toBeTruthy();

		// SEND QUOTE
		const sendRes = await authenticatedRequest(app, testUser.cookies).post(`/api/quotes/${created.id}/send`).expect(201).then((r: any) => r.body);
		expect(sendRes.publicUrl).toMatch(/public\/devis\//);
		const token = String(sendRes.publicUrl).split('/').filter(Boolean).pop()!;

		// VIEW QUOTE (public)
		const viewRes = await request(app.getHttpServer()).get(`/api/public/quotes/${token}`).expect(200).then((r: any) => r.body);
		expect(viewRes.id).toBe(created.id);

		// ACCEPT QUOTE (public)
		const acceptRes = await request(app.getHttpServer()).post(`/api/public/quotes/${token}/accept`).expect(201).then((r: any) => r.body);
		expect(acceptRes.status).toBe('accepted');
		expect(acceptRes.invoiceId).toBeDefined();

		const invoice = await prisma.invoice.findUnique({
			where: { sourceQuoteId: created.id },
		});
		expect(invoice).toBeTruthy();
		expect(invoice?.clientId).toBe(client.id);
	});

	// ========================================
	// TESTS D'INTÉGRATION - EMAIL ET WEBHOOKS
	// ========================================

	it('email sending and webhook processing', async () => {
		const client = await prisma.client.create({
			data: { 
				name: 'Email Client', 
				email: uniqueEmail('email@test.com'), 
				isCompany: true, 
				countryCode: 'FR',
				organizationId: testUser.organizationId
			}
		});
		const quote = await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({ clientId: client.id, lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }] })
			.expect(201)
			.then((r: any) => r.body);

		// Send quote (triggers email)
		await authenticatedRequest(app, testUser.cookies).post(`/api/quotes/${quote.id}/send`).expect(201);

		// Simulate email webhook events
		await request(app.getHttpServer())
			.post('/api/webhooks/email')
			.send({
				quoteId: quote.id,
				type: 'delivered',
				providerId: 'test-123'
			})
			.expect(201);

		await request(app.getHttpServer())
			.post('/api/webhooks/email')
			.send({
				quoteId: quote.id,
				type: 'opened',
				providerId: 'test-123'
			})
			.expect(201);

		// Verify events stored
		const events = await prisma.emailEvent.findMany({
			where: { quoteId: quote.id },
			orderBy: { createdAt: 'asc' },
		});
		const webhookTypes = events.filter((e) => e.type === 'delivered' || e.type === 'opened');
		expect(webhookTypes).toHaveLength(2);
		expect(webhookTypes[0].type).toBe('delivered');
		expect(webhookTypes[1].type).toBe('opened');
	});

	// ========================================
	// TESTS DE PERFORMANCE - PDF GÉNÉRATION
	// ========================================

	it('PDF generation', async () => {
		const client = await prisma.client.create({
			data: { 
				name: 'PDF Client', 
				email: uniqueEmail('pdf@c.test'), 
				isCompany: true, 
				countryCode: 'FR',
				organizationId: testUser.organizationId
			}
		});
		const quote = await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({ clientId: client.id, lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }] })
			.expect(201)
			.then((r: any) => r.body);

		const res = await authenticatedRequest(app, testUser.cookies).get(`/api/quotes/${quote.id}/pdf`).buffer(true).parse((res: any, cb: any) => {
			const data: Uint8Array[] = [];
			res.on('data', (chunk: any) => data.push(chunk));
			res.on('end', () => cb(null, Buffer.concat(data)));
		}).expect(200);

		expect(res.headers['content-type']).toContain('application/pdf');
		expect((res.body as Buffer).length).toBeGreaterThan(0);
	});

	// ========================================
	// TESTS COMPTA - HORS-BILAN DEVIS
	// ========================================

	it('off-balance entry created on send and contra on reject', async () => {
		const client = await prisma.client.create({
			data: { 
				name: 'HB Client', 
				email: uniqueEmail('hb@test.com'), 
				isCompany: true, 
				countryCode: 'FR',
				organizationId: testUser.organizationId
			}
		});
		const quote = await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({ clientId: client.id, lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }] })
			.expect(201)
			.then((r: any) => r.body);

		// Prépare les comptes et le journal OD requis par l'écriture hors-bilan
		await request(app.getHttpServer()).post('/api/accounting/accounts').send({ code: '411', name: 'Clients', type: 'CUSTOMER' });
		await request(app.getHttpServer()).post('/api/accounting/accounts').send({ code: '706', name: 'Prestations', type: 'REVENUE' });
		await request(app.getHttpServer()).post('/api/accounting/accounts').send({ code: '44571', name: 'TVA collectée', type: 'TAX' });
		await request(app.getHttpServer()).post('/api/accounting/journals').send({ code: 'OD', name: 'Opérations diverses' });

		const send = await authenticatedRequest(app, testUser.cookies).post(`/api/quotes/${quote.id}/send`).expect(201).then((r: any) => r.body);
		const sentEntry = await prisma.journalEntry.findFirst({
			where: { journal: { code: 'OD' }, reference: `DEV ${quote.number}` },
			include: { lines: { include: { account: true } } },
			orderBy: { id: 'desc' }
		});
		expect(sentEntry).toBeTruthy();
		const debit411 = sentEntry!.lines.find((l: any) => l.account.code === '411');
		const credit706 = sentEntry!.lines.find((l: any) => l.account.code === '706');
		const credit44571 = sentEntry!.lines.find((l: any) => l.account.code === '44571');
		expect(Number((debit411!.debit as any)?.toNumber?.() ?? debit411!.debit)).toBe(120);
		expect(Number((credit706!.credit as any)?.toNumber?.() ?? credit706!.credit)).toBe(100);
		expect(Number((credit44571!.credit as any)?.toNumber?.() ?? credit44571!.credit)).toBe(20);

		const token = String(send.publicUrl).split('/').pop()!;
		await request(app.getHttpServer()).post(`/api/public/quotes/${token}/reject`).expect(201);
		const contra = await prisma.journalEntry.findFirst({
			where: { journal: { code: 'OD' }, reference: `ANNUL DEV ${quote.number}` },
			include: { lines: { include: { account: true } } },
			orderBy: { id: 'desc' }
		});
		expect(contra).toBeTruthy();
		const contraDebit706 = contra!.lines.find((l: any) => l.account.code === '706');
		const contraDebit44571 = contra!.lines.find((l: any) => l.account.code === '44571');
		const contraCredit411 = contra!.lines.find((l: any) => l.account.code === '411');
		expect(Number((contraDebit706!.debit as any)?.toNumber?.() ?? contraDebit706!.debit)).toBe(100);
		expect(Number((contraDebit44571!.debit as any)?.toNumber?.() ?? contraDebit44571!.debit)).toBe(20);
		expect(Number((contraCredit411!.credit as any)?.toNumber?.() ?? contraCredit411!.credit)).toBe(120);
	});

	// ========================================
	// TESTS D'INTÉGRATION - CONVERSION DEVIS
	// ========================================

	it('quote to invoice conversion', async () => {
		const client = await prisma.client.create({
			data: { 
				name: 'Convert Client', 
				email: uniqueEmail('convert@test.com'), 
				isCompany: true, 
				countryCode: 'FR',
				organizationId: testUser.organizationId
			}
		});
		const quote = await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({ clientId: client.id, lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }] })
			.expect(201)
			.then((r: any) => r.body);

		await authenticatedRequest(app, testUser.cookies)
			.post(`/api/quotes/${quote.id}/send`)
			.expect(201);

		const invoice = await authenticatedRequest(app, testUser.cookies)
			.post(`/api/quotes/${quote.id}/convert-to-invoice`)
			.expect(201)
			.then((r: any) => r.body);

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
		const client = await prisma.client.create({
			data: { 
				name: 'Test Client', 
				email: uniqueEmail('test-validation@example.com'), 
				isCompany: true, 
				countryCode: 'FR',
				organizationId: testUser.organizationId
			}
		});

		// Client inexistant
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({
				clientId: 99999,
				lines: [{ description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 }]
			})
			.expect(404); // Client introuvable

		// Lignes vides
		await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({
				clientId: client.id,
				lines: []
			})
			.expect(400);

		// Token invalide
		await request(app.getHttpServer()).get('/public/quotes/invalid-token').expect(404);
	});
});
