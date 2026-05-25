import * as request from 'supertest';
import { generateEntityId } from '../common/entity-id';
import { randomBytes } from 'crypto';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';

describe('Stripe e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	const publicToken = randomBytes(32).toString('hex');
	let invoiceId: string;

	const mockStripeService = {
		isConfigured: () => true,
		createPaymentIntentForInvoice: jest.fn().mockResolvedValue({
			clientSecret: 'pi_test_secret',
			amount: 120,
			currency: 'EUR'
		}),
		handleWebhook: jest.fn().mockResolvedValue({ received: true }),
		fulfillPaymentIntent: jest.fn()
	};

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule]
		})
			.overrideProvider(StripeService)
			.useValue(mockStripeService)
			.compile();

		app = moduleRef.createNestApplication({ rawBody: true });
		app.setGlobalPrefix('api');
		await app.init();

		prisma = app.get(PrismaService);

		const client = await prisma.client.create({
			data: { id: generateEntityId(), 
				name: 'Stripe Test Client',
				email: `stripe-${Date.now()}@example.com`,
				isCompany: true,
				countryCode: 'FR'
			}
		});

		const invoice = await prisma.invoice.create({
			data: { id: generateEntityId(), 
				number: `STR-${Date.now()}`,
				clientId: client.id,
				status: 'SENT',
				subtotal: 100,
				tax: 20,
				total: 120,
				balance: 120,
				currency: 'EUR',
				publicToken,
				sentAt: new Date(),
				lines: {
					create: {
						description: 'Prestation test',
						quantity: 1,
						unitPrice: 100,
						taxRate: 0.2,
						taxAmount: 20,
						total: 120
					}
				}
			}
		});
		invoiceId = invoice.id;
	});

	afterAll(async () => {
		await prisma.payment.deleteMany({ where: { invoiceId } });
		await prisma.invoiceLine.deleteMany({ where: { invoiceId } });
		await prisma.invoice.delete({ where: { id: invoiceId } });
		await app.close();
	});

	it('GET public invoice exposes stripeEnabled and balance', async () => {
		const res = await request(app.getHttpServer())
			.get(`/api/public/invoices/${publicToken}`)
			.expect(200);

		expect(res.body.number).toBeDefined();
		expect(res.body.balance).toBe(120);
		expect(res.body.canPayOnline).toBeDefined();
		expect(typeof res.body.stripeEnabled).toBe('boolean');
	});

	it('GET checkout returns invoice and payment', async () => {
		const res = await request(app.getHttpServer())
			.get(`/api/public/invoices/${publicToken}/checkout`)
			.expect(200);
		expect(res.body.invoice?.number).toBeDefined();
		expect(res.body.invoice.balance).toBe(120);
	});

	it('POST create-payment-intent delegates to StripeService', async () => {
		const res = await request(app.getHttpServer())
			.post(`/api/public/invoices/${publicToken}/create-payment-intent`)
			.expect(201);

		expect(res.body.clientSecret).toBe('pi_test_secret');
		expect(res.body.amount).toBe(120);
		expect(mockStripeService.createPaymentIntentForInvoice).toHaveBeenCalledWith(publicToken);
	});

	it('POST webhook stripe without signature returns 400', async () => {
		await request(app.getHttpServer())
			.post('/api/webhooks/stripe')
			.send({ type: 'payment_intent.succeeded' })
			.expect(400);
	});
});
