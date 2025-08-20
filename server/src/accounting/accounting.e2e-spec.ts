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

	it('create accounts, journal and balanced entry', async () => {
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '512', name: 'Banque', type: 'BANK' }).expect(201);
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '706', name: 'Prestations', type: 'REVENUE' }).expect(201);
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '44571', name: 'TVA collectée', type: 'TAX' }).expect(201);
		await request(app.getHttpServer()).post('/accounting/journals').send({ code: 'VE', name: 'Ventes' }).expect(201);
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
});


