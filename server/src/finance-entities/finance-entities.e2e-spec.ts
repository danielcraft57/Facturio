import * as cookieParser from 'cookie-parser'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../app.module'
import { PrismaService } from '../prisma/prisma.service'
import {
	authenticatedRequest,
	createTestUser,
	TestUser,
} from '../common/test-helpers/auth.helper'
import { expectEntityId, UNKNOWN_ENTITY_ID } from '../common/test-helpers/entity-id.helper'

function uniqueEmail(base: string): string {
	const [local, domain] = base.split('@')
	return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@${domain}`
}

describe('Finance entities (client, facture, devis) e2e', () => {
	let app: INestApplication
	let prisma: PrismaService
	let testUser: TestUser

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
		app = moduleRef.createNestApplication()
		app.setGlobalPrefix('api')
		app.use(cookieParser())
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				transform: true,
				forbidUnknownValues: false,
			}),
		)
		await app.init()
		prisma = app.get(PrismaService)
		testUser = await createTestUser(app, prisma)
	})

	afterAll(async () => {
		await app.close()
	})

	it('client: create + patch retournent un id court (10 car.)', async () => {
		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/clients')
			.send({
				name: 'Client formulaire',
				email: uniqueEmail('finance-client@example.com'),
				isCompany: true,
				countryCode: 'FR',
			})
			.expect(201)
			.then((r: { body: { id: string; name: string } }) => r.body)

		expectEntityId(created.id)

		const updated = await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/clients/${created.id}`)
			.send({ name: 'Client modifié', companyName: 'SARL Test' })
			.expect(200)
			.then((r: { body: { id: string; name: string; companyName?: string } }) => r.body)

		expectEntityId(updated.id)
		expect(updated.id).toBe(created.id)
		expect(updated.name).toBe('Client modifié')
		expect(updated.companyName).toBe('SARL Test')
	})

	it('facture: create + patch retournent un id court (10 car.)', async () => {
		const client = await prisma.client.create({
			data: {
				name: 'Client facture',
				email: uniqueEmail('finance-invoice-client@example.com'),
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		})
		expectEntityId(client.id)

		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/invoices')
			.send({
				clientId: client.id,
				organizationId: testUser.organizationId,
				lines: [{ description: 'Prestation', quantity: 1, unitPrice: 120, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string; status: string } }) => r.body)

		expectEntityId(created.id)
		expect(created.status).toBe('DRAFT')

		const updated = await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/invoices/${created.id}`)
			.send({
				lines: [{ description: 'Prestation mise à jour', quantity: 2, unitPrice: 100, taxRate: 0.2 }],
			})
			.expect(200)
			.then((r: { body: { id: string } }) => r.body)

		expectEntityId(updated.id)
		expect(updated.id).toBe(created.id)
	})

	it('devis: create + patch retournent un id court (10 car.)', async () => {
		const client = await prisma.client.create({
			data: {
				name: 'Client devis',
				email: uniqueEmail('finance-quote-client@example.com'),
				isCompany: true,
				countryCode: 'FR',
				organizationId: testUser.organizationId,
			},
		})

		const created = await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({
				clientId: client.id,
				lines: [{ description: 'Mission', quantity: 1, unitPrice: 500, taxRate: 0.2 }],
			})
			.expect(201)
			.then((r: { body: { id: string; status: string } }) => r.body)

		expectEntityId(created.id)
		expect(created.status).toBe('DRAFT')

		const updated = await authenticatedRequest(app, testUser.cookies)
			.patch(`/api/devis/${created.id}`)
			.send({
				lines: [{ description: 'Mission révisée', quantity: 1, unitPrice: 600, taxRate: 0.2 }],
			})
			.expect(200)
			.then((r: { body: { id: string } }) => r.body)

		expectEntityId(updated.id)
		expect(updated.id).toBe(created.id)
	})

	it('identifiant invalide ou inexistant → 400 / 404', async () => {
		await authenticatedRequest(app, testUser.cookies).get('/api/clients/not-valid-id').expect(400)
		await authenticatedRequest(app, testUser.cookies)
			.get(`/api/clients/${UNKNOWN_ENTITY_ID}`)
			.expect(404)

		await authenticatedRequest(app, testUser.cookies)
			.post('/api/quotes')
			.send({
				clientId: UNKNOWN_ENTITY_ID,
				lines: [{ description: 'X', quantity: 1, unitPrice: 10, taxRate: 0.2 }],
			})
			.expect(404)
	})
})
