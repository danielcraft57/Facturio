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

	it('service purchase then service payment', async () => {
		// S'assure que les journaux/comptes existent (seed devrait le faire, mais on sécurise)
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '622', name: 'Services exterieurs', type: 'EXPENSE' });
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '44566', name: 'TVA déductible', type: 'TAX' });
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '401', name: 'Fournisseurs', type: 'SUPPLIER' });
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '512', name: 'Banque', type: 'BANK' });
		await request(app.getHttpServer()).post('/accounting/journals').send({ code: 'OD', name: 'Opérations diverses' });
		await request(app.getHttpServer()).post('/accounting/journals').send({ code: 'BQ', name: 'Banque' });
		// Achat services 100 HT, TVA 20 => 622/44566/401
		await request(app.getHttpServer())
			.post('/accounting/purchases/service')
			.send({ amountExclTax: 100, taxRate: 0.2, memo: 'Presta externe' })
			.expect(201);
		// Paiement 120 TTC => 401/512
		await request(app.getHttpServer())
			.post('/accounting/payments/service')
			.send({ amount: 120, memo: 'Virement fournisseur' })
			.expect(201);
	});

	it('payroll + salary and urssaf payments', async () => {
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '641', name: 'Rémunérations du personnel', type: 'EXPENSE' });
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '645', name: 'Charges patronales', type: 'EXPENSE' });
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '421', name: 'Salaires à payer', type: 'LIABILITY' });
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '431', name: 'URSSAF', type: 'LIABILITY' });
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '512', name: 'Banque', type: 'BANK' });
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '635', name: 'Autres impôts, taxes et assimilés', type: 'EXPENSE' });
		await request(app.getHttpServer()).post('/accounting/accounts').send({ code: '447', name: 'Autres impôts et taxes à payer', type: 'LIABILITY' });
		await request(app.getHttpServer()).post('/accounting/journals').send({ code: 'OD', name: 'Opérations diverses' });
		await request(app.getHttpServer()).post('/accounting/journals').send({ code: 'BQ', name: 'Banque' });

		// Créer une facture de test pour avoir du CA
		const client = await request(app.getHttpServer()).post('/clients').send({ name: 'Test Client', email: 'test@test.com', isCompany: true, countryCode: 'FR' }).expect(201).then(r => r.body);
		await request(app.getHttpServer())
			.post('/invoices')
			.send({ clientId: client.id, lines: [{ description: 'Service Test', quantity: 1, unitPrice: 1000, taxRate: 0.2 }] })
			.expect(201);

		// Micro-social sur période courte (taux 22%)
		await request(app.getHttpServer())
			.post('/accounting/contrib/micro-social')
			.send({ periodStart: '1970-01-01', periodEnd: '2999-12-31', rate: 0.22, reference: 'MICRO-TEST' })
			.expect(201);

		// C3S si seuil (ici on met un seuil très bas)
		await request(app.getHttpServer())
			.post('/accounting/contrib/c3s')
			.send({ year: new Date().getFullYear(), threshold: 1, rate: 0.0016, reference: 'C3S-TEST' })
			.expect(201);
	});
});


