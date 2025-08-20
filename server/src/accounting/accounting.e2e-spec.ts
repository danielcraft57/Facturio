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
});


