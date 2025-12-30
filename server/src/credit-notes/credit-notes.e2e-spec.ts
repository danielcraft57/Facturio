import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('CreditNotes e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let clientId: number;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
		app = moduleRef.createNestApplication();
		app.setGlobalPrefix('api');
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				transform: true,
				forbidUnknownValues: false
			})
		);
		await app.init();
		prisma = app.get(PrismaService);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		// Nettoyer la base avant chaque test
		await prisma.creditNoteApplication.deleteMany({});
		await prisma.creditNoteLine.deleteMany({});
		await prisma.creditNote.deleteMany({});
		await prisma.client.deleteMany({});

		// Créer un client de test
		const client = await prisma.client.create({
			data: {
				name: 'Test Client',
				email: 'test@example.com',
				isCompany: true
			}
		});
		clientId = client.id;
	});

	describe('POST /credit-notes', () => {
		it('devrait créer un avoir valide', () => {
			return request(app.getHttpServer())
				.post('/api/credit-notes')
				.send({
					clientId,
					lines: [
						{
							description: 'Remboursement',
							quantity: 1,
							unitPrice: 100,
							taxRate: 0.2
						}
					]
				})
				.expect(201)
				.expect((res) => {
					expect(res.body).toHaveProperty('id');
					expect(res.body).toHaveProperty('number');
					expect(res.body.clientId).toBe(clientId);
					expect(res.body.lines).toHaveLength(1);
					expect(Number(res.body.total)).toBe(120);
				});
		});

		it('devrait rejeter un avoir sans lignes', () => {
			return request(app.getHttpServer())
				.post('/api/credit-notes')
				.send({
					clientId,
					lines: []
				})
				.expect(400);
		});

		it('devrait rejeter un avoir avec un client invalide', () => {
			return request(app.getHttpServer())
				.post('/api/credit-notes')
				.send({
					clientId: 99999,
					lines: [
						{
							description: 'Test',
							quantity: 1,
							unitPrice: 100
						}
					]
				})
				.expect(404);
		});
	});

	describe('GET /credit-notes', () => {
		beforeEach(async () => {
			// Créer des avoirs de test
			await prisma.creditNote.createMany({
				data: [
					{
						number: 'AVO-2024-0001',
						clientId,
						date: new Date(),
						status: 'DRAFT',
						subtotal: 100,
						tax: 20,
						total: 120,
						appliedAmount: 0,
						currency: 'EUR'
					},
					{
						number: 'AVO-2024-0002',
						clientId,
						date: new Date(),
						status: 'SENT',
						subtotal: 200,
						tax: 40,
						total: 240,
						appliedAmount: 0,
						currency: 'EUR'
					}
				]
			});
		});

		it('devrait retourner la liste des avoirs', () => {
			return request(app.getHttpServer())
				.get('/api/credit-notes')
				.expect(200)
				.expect((res) => {
					expect(res.body).toHaveProperty('data');
					expect(res.body).toHaveProperty('pagination');
					expect(res.body.data.length).toBeGreaterThan(0);
				});
		});

		it('devrait paginer les résultats', () => {
			return request(app.getHttpServer())
				.get('/api/credit-notes?page=1&pageSize=1')
				.expect(200)
				.expect((res) => {
					expect(res.body.data.length).toBe(1);
					expect(res.body.pagination.pageSize).toBe(1);
				});
		});
	});

	describe('GET /credit-notes/:id', () => {
		it('devrait retourner un avoir existant', async () => {
			const creditNote = await prisma.creditNote.create({
				data: {
					number: 'AVO-2024-0001',
					clientId,
					invoiceId: null,
					date: new Date(),
					status: 'DRAFT',
					subtotal: 100,
					tax: 20,
					total: 120,
					appliedAmount: 0,
					currency: 'EUR'
				}
			});

			return request(app.getHttpServer())
				.get(`/api/credit-notes/${creditNote.id}`)
				.expect(200)
				.expect((res) => {
					expect(res.body.id).toBe(creditNote.id);
					expect(res.body.number).toBe('AVO-2024-0001');
				});
		});

		it('devrait retourner 404 pour un avoir inexistant', () => {
			return request(app.getHttpServer()).get('/api/credit-notes/99999').expect(404);
		});
	});

	describe('POST /credit-notes/:id/apply', () => {
		it('devrait imputer un avoir sur une facture', async () => {
			const creditNote = await prisma.creditNote.create({
				data: {
					number: 'AVO-2024-0001',
					clientId,
					invoiceId: null,
					date: new Date(),
					status: 'DRAFT',
					subtotal: 100,
					tax: 20,
					total: 120,
					appliedAmount: 0,
					currency: 'EUR'
				}
			});

			const invoice = await prisma.invoice.create({
				data: {
					number: 'FAC-2024-0001',
					clientId,
					date: new Date(),
					status: 'SENT',
					subtotal: 200,
					tax: 40,
					total: 240,
					balance: 240,
					currency: 'EUR'
				}
			});

			return request(app.getHttpServer())
				.post(`/api/credit-notes/${creditNote.id}/apply`)
				.send({
					invoiceId: invoice.id,
					amount: 50
				})
				.expect(200)
				.expect((res) => {
					expect(res.body.applications).toHaveLength(1);
					expect(Number(res.body.appliedAmount)).toBe(50);
				});
		});
	});
});

