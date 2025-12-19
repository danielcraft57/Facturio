import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Products e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Nettoyage minimal des données liées
    await prisma.subscription.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.product.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('create -> list -> get -> update -> delete', async () => {
    // CREATE
    const created = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Produit test',
        sku: 'TEST-PROD',
        unitPrice: 99,
      })
      .expect(201)
      .then((r) => r.body);

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Produit test');

    // LIST
    const list = await request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .then((r) => r.body);

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);

    // GET
    const retrieved = await request(app.getHttpServer())
      .get(`/products/${created.id}`)
      .expect(200)
      .then((r) => r.body);

    expect(retrieved.id).toBe(created.id);
    expect(retrieved.name).toBe('Produit test');

    // UPDATE
    const updated = await request(app.getHttpServer())
      .patch(`/products/${created.id}`)
      .send({ name: 'Produit modifie' })
      .expect(200)
      .then((r) => r.body);

    expect(updated.name).toBe('Produit modifie');

    // DELETE
    await request(app.getHttpServer())
      .delete(`/products/${created.id}`)
      .expect(200);

    // Vérifier qu'il n'existe plus
    await request(app.getHttpServer())
      .get(`/products/${created.id}`)
      .expect(404);
  });

  it('returns 404 for unknown product', async () => {
    await request(app.getHttpServer())
      .get('/products/999999')
      .expect(404);
  });
});


