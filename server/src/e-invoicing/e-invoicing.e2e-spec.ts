import * as cookieParser from 'cookie-parser';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SaasBillingPlan } from '@prisma/client';
import { AppModule } from '../app.module';
import { authenticatedRequest, createTestUser, TestUser } from '../common/test-helpers/auth.helper';
import { PrismaService } from '../prisma/prisma.service';

function uniqueEmail(base: string): string {
	const [local, domain] = base.split('@');
	return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@${domain}`;
}

describe('E-invoicing e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let testUser: TestUser;

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

		await prisma.$executeRawUnsafe('DELETE FROM InvoiceLine');
		await prisma.$executeRawUnsafe('DELETE FROM Payment');
		await prisma.$executeRawUnsafe('DELETE FROM Invoice');

		testUser = await createTestUser(app, prisma);

		const suffix = String(Date.now()).slice(-6);
		await prisma.organization.update({
			where: { id: testUser.organizationId },
			data: {
				name: 'Org e-facture',
				siret: `12345678${suffix}`.slice(0, 14),
				siren: '123456789',
				vatNumber: `FRTEST${suffix}`,
				address: '1 rue Test',
				zipCode: '75001',
				city: 'Paris',
				countryCode: 'FR',
				email: 'org-efacture@test.com',
			},
		});
	});

	afterAll(async () => {
		await app.close();
	});

	async function seedReadyInvoice(plan: SaasBillingPlan) {
		await prisma.organization.update({
			where: { id: testUser.organizationId },
			data: { saasPlan: plan },
		});

		const client = await prisma.client.create({
			data: {
				name: 'Client B2B',
				email: uniqueEmail('b2b-efacture@test.com'),
				isCompany: true,
				companyName: 'Client B2B SAS',
				siren: '987654321',
				vatNumber: 'FR98765432109',
				address: '2 avenue Client',
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		});

		const invoice = await prisma.invoice.create({
			data: {
				number: `FAC-E2E-${Date.now()}`,
				status: 'SENT',
				sentAt: new Date(),
				clientId: client.id,
				organizationId: testUser.organizationId,
				subtotal: 100,
				tax: 20,
				total: 120,
				balance: 120,
				currency: 'EUR',
				lines: {
					create: [{ description: 'Prestation test', quantity: 1, unitPrice: 100, total: 100, taxRate: 0.2, taxAmount: 20 }],
				},
			},
			include: { lines: true },
		});

		return invoice;
	}

	it('GET /e-invoicing/readiness — score org et plan', async () => {
		await prisma.organization.update({
			where: { id: testUser.organizationId },
			data: { saasPlan: SaasBillingPlan.PRO_EFACTURE },
		});

		const body = await authenticatedRequest(app, testUser.cookies)
			.get('/api/e-invoicing/readiness')
			.expect(200)
			.then((r: any) => r.body);

		expect(body.score).toBeGreaterThan(0);
		expect(body.planAllowsEInvoicing).toBe(true);
		expect(body.paConnected).toBe(false);
		expect(body.reformDates?.reception).toBe('2026-09-01');
	});

	it('GET factur-x refusé sur plan Free', async () => {
		const invoice = await seedReadyInvoice(SaasBillingPlan.FREE);

		await authenticatedRequest(app, testUser.cookies)
			.get(`/api/e-invoicing/invoices/${invoice.id}/factur-x`)
			.expect(403);
	});

	it('GET factur-x génère XML sur plan Pro + e-facture', async () => {
		const invoice = await seedReadyInvoice(SaasBillingPlan.PRO_EFACTURE);

		const readiness = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/e-invoicing/invoices/${invoice.id}/readiness`)
			.expect(200)
			.then((r: any) => r.body);

		expect(readiness.canGenerateFacturX).toBe(true);

		const res = await authenticatedRequest(app, testUser.cookies)
			.get(`/api/e-invoicing/invoices/${invoice.id}/factur-x`)
			.expect(200);

		expect(res.headers['content-type']).toMatch(/xml/);
		expect(res.text).toContain('FacturioCrossIndustryInvoice');

		const updated = await prisma.invoice.findUnique({ where: { id: invoice.id } });
		expect(updated?.eInvoiceStatus).toBe('XML_GENERATED');
		expect(updated?.eInvoiceXmlHash).toBeTruthy();
	});

	it('POST client avec SIREN — persistance', async () => {
		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/clients')
			.send({
				name: 'SIREN Client',
				email: uniqueEmail('siren-client@test.com'),
				isCompany: true,
				siren: '111222333',
				countryCode: 'FR',
			})
			.expect(201)
			.then((r: any) => r.body);

		expect(created.siren).toBe('111222333');
	});
});
