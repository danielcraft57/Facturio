import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Dashboard e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule]
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();

		prisma = app.get(PrismaService);
	});

	afterAll(async () => {
		await app.close();
	});

	it('should return dashboard stats', async () => {
		const response = await request(app.getHttpServer())
			.get('/dashboard/stats')
			.expect(200)
			.then((r) => r.body);

		expect(response).toBeDefined();
		expect(response.revenue).toBeDefined();
		expect(response.invoices).toBeDefined();
		expect(response.clients).toBeDefined();
		expect(response.topClients).toBeDefined();
		expect(response.recentActivity).toBeDefined();
		expect(response.monthlyRevenue).toBeDefined();
		expect(response.chartData).toBeDefined();

		expect(typeof response.revenue.total).toBe('number');
		expect(typeof response.revenue.thisMonth).toBe('number');
		expect(typeof response.revenue.lastMonth).toBe('number');
		expect(Array.isArray(response.topClients)).toBe(true);
		expect(Array.isArray(response.recentActivity)).toBe(true);
		expect(Array.isArray(response.monthlyRevenue)).toBe(true);
	});

	it('should return dashboard stats with date range', async () => {
		const startDate = '2024-01-01';
		const endDate = '2024-12-31';

		const response = await request(app.getHttpServer())
			.get(`/dashboard/stats?startDate=${startDate}&endDate=${endDate}`)
			.expect(200)
			.then((r) => r.body);

		expect(response).toBeDefined();
		expect(response.revenue).toBeDefined();
		expect(response.invoices).toBeDefined();
	});
});

