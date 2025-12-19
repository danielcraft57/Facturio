import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { BillingInterval, SubscriptionStatus } from '@prisma/client';

function uniqueEmail(base: string): string {
  const [local, domain] = base.split('@');
  return `${local}+${Date.now()}-${Math.random().toString(36).slice(2)}@${domain}`;
}

describe('Subscriptions e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let clientId: number;
  let productId: number;
  let planId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Nettoyage des données liées à l'abonnement.
    // On évite de supprimer tous les clients pour ne pas casser les autres tests (FK).
    await prisma.subscription.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.product.deleteMany();

    // Données de base nécessaires (client + produit + plan)
    const client = await prisma.client.create({
      data: {
        name: 'Client Abonnement',
        email: uniqueEmail('sub-client@test.com'),
        isCompany: true,
        countryCode: 'FR',
      },
    });
    clientId = client.id;

    const product = await prisma.product.create({
      data: {
        name: 'Produit Abonnement',
        sku: 'SUB-PROD',
      },
    });
    productId = product.id;

    const plan = await prisma.plan.create({
      data: {
        productId,
        name: 'Plan mensuel test',
        amount: 199,
        currency: 'EUR',
        interval: BillingInterval.MONTH,
      },
    });
    planId = plan.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('plans CRUD', async () => {
    // LIST plans (inclut au moins le plan seedé ci-dessus)
    const list = await request(app.getHttpServer())
      .get('/subscriptions/plans')
      .expect(200)
      .then((r) => r.body);

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);

    // CREATE plan
    const createdPlan = await request(app.getHttpServer())
      .post('/subscriptions/plans')
      .send({
        productId,
        name: 'Plan annuel test',
        amount: 1990,
        currency: 'EUR',
        interval: BillingInterval.YEAR,
      })
      .expect(201)
      .then((r) => r.body);

    expect(createdPlan.id).toBeDefined();
    expect(createdPlan.name).toBe('Plan annuel test');

    // GET plan
    const retrieved = await request(app.getHttpServer())
      .get(`/subscriptions/plans/${createdPlan.id}`)
      .expect(200)
      .then((r) => r.body);

    expect(retrieved.id).toBe(createdPlan.id);

    // UPDATE plan
    const updated = await request(app.getHttpServer())
      .patch(`/subscriptions/plans/${createdPlan.id}`)
      .send({ name: 'Plan annuel modifie' })
      .expect(200)
      .then((r) => r.body);

    expect(updated.name).toBe('Plan annuel modifie');

    // DELETE plan
    await request(app.getHttpServer())
      .delete(`/subscriptions/plans/${createdPlan.id}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/subscriptions/plans/${createdPlan.id}`)
      .expect(404);
  });

  it('subscriptions lifecycle', async () => {
    // CREATE subscription
    const created = await request(app.getHttpServer())
      .post('/subscriptions')
      .send({
        clientId,
        planId,
        quantity: 3,
      })
      .expect(201)
      .then((r) => r.body);

    expect(created.id).toBeDefined();
    expect(created.clientId).toBe(clientId);
    expect(created.planId).toBe(planId);
    expect(created.quantity).toBe(3);

    const subscriptionId = created.id;

    // LIST subscriptions
    const list = await request(app.getHttpServer())
      .get('/subscriptions')
      .expect(200)
      .then((r) => r.body);

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);

    // GET subscription
    const retrieved = await request(app.getHttpServer())
      .get(`/subscriptions/${subscriptionId}`)
      .expect(200)
      .then((r) => r.body);

    expect(retrieved.id).toBe(subscriptionId);

    // UPDATE subscription
    const updated = await request(app.getHttpServer())
      .patch(`/subscriptions/${subscriptionId}`)
      .send({ quantity: 5 })
      .expect(200)
      .then((r) => r.body);

    expect(updated.quantity).toBe(5);

    // Cancel at period end
    const cancelAtEnd = await request(app.getHttpServer())
      .post(`/subscriptions/${subscriptionId}/cancel-at-period-end`)
      .expect(201)
      .then((r) => r.body);

    expect(cancelAtEnd.cancelAtPeriodEnd).toBe(true);

    // Cancel now
    const cancelNow = await request(app.getHttpServer())
      .post(`/subscriptions/${subscriptionId}/cancel-now`)
      .expect(201)
      .then((r) => r.body);

    expect(cancelNow.status).toBe(SubscriptionStatus.CANCELED);
    expect(cancelNow.canceledAt).toBeDefined();
  });

  it('returns 404 for unknown subscription', async () => {
    await request(app.getHttpServer())
      .get('/subscriptions/999999')
      .expect(404);
  });
});


