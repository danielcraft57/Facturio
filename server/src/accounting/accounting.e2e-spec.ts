import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';

describe('Accounting e2e', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
		app = moduleRef.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('post a balanced entry using seeded accounts/journal', async () => {
		await request(app.getHttpServer())
			.post('/accounting/entries')
			.send({
				journalCode: 'VE',
				lines: [
					{ accountCode: '512', debit: 120 },
					{ accountCode: '706', credit: 100 },
					{ accountCode: '44571', credit: 20 }
				]
			})
			.expect(201);
	});

	it('balance report returns totals', async () => {
		const res = await request(app.getHttpServer()).get('/accounting/reports/balance').expect(200).then(r => r.body);
		expect(Array.isArray(res)).toBe(true);
		expect(res.find((r: any) => r.accountCode === '706')).toBeDefined();
	});

	it('general ledger returns lines', async () => {
		const res = await request(app.getHttpServer()).get('/accounting/reports/general-ledger?account=706').expect(200).then(r => r.body);
		expect(Array.isArray(res)).toBe(true);
		const acc = res.find((x: any) => x.accountCode === '706');
		expect(acc).toBeDefined();
	});

	it('export FEC returns text data', async () => {
		const res = await request(app.getHttpServer()).get('/accounting/exports/fec').expect(200);
		expect(typeof res.text).toBe('string');
		expect(res.text.split('\n')[0]).toContain('JournalCode');
	});
});


