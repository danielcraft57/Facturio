# Guide des tests - Facturio

Documentation sur les tests dans le projet Facturio.

## Vue d'ensemble

Le projet utilise Jest pour les tests unitaires et E2E, avec une couverture progressive.

## Types de tests

### Tests unitaires

Tests des services, DTOs et utilitaires isolément.

**Emplacement** : `server/src/**/*.spec.ts`

**Exemples** :
- `products.service.spec.ts` : Tests du service products
- `create-product.dto.spec.ts` : Tests de validation DTO
- `http-exception.filter.spec.ts` : Tests du filter d'exceptions

### Tests E2E

Tests d'intégration des endpoints complets.

**Emplacement** : `server/src/**/*.e2e-spec.ts`

**Exemples** :
- `products.e2e-spec.ts` : Tests E2E des endpoints produits
- `clients.e2e-spec.ts` : Tests E2E des endpoints clients
- `invoices.e2e-spec.ts` : Tests E2E des endpoints factures

## Structure des tests

### Test unitaire exemple

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
	let service: ProductsService;
	let prisma: PrismaService;

	const mockPrismaService = {
		product: {
			create: jest.fn(),
			findMany: jest.fn(),
			// ...
		}
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProductsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService
				}
			]
		}).compile();

		service = module.get<ProductsService>(ProductsService);
		prisma = module.get<PrismaService>(PrismaService);
	});

	it('devrait créer un produit', async () => {
		// Arrange
		const dto = { name: 'Test', unitPrice: 100 };
		mockPrismaService.product.create.mockResolvedValue({ id: 1, ...dto });

		// Act
		const result = await service.create(dto);

		// Assert
		expect(result).toHaveProperty('id');
		expect(mockPrismaService.product.create).toHaveBeenCalledWith({
			data: dto,
			include: { defaultTaxRate: true }
		});
	});
});
```

### Test E2E exemple

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Products e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ 
			imports: [AppModule] 
		}).compile();
		
		app = moduleRef.createNestApplication();
		app.setGlobalPrefix('api');
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				transform: true
			})
		);
		await app.init();
		prisma = app.get(PrismaService);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await prisma.product.deleteMany({});
	});

	it('devrait créer un produit valide', () => {
		return request(app.getHttpServer())
			.post('/api/products')
			.send({ name: 'Test Product', unitPrice: 100 })
			.expect(201)
			.expect((res) => {
				expect(res.body).toHaveProperty('id');
				expect(res.body.name).toBe('Test Product');
			});
	});
});
```

## Exécution des tests

### Tous les tests

```bash
npm test
```

### Tests unitaires uniquement

```bash
npm test -- --testPathPattern="spec" --testPathIgnorePatterns="e2e"
```

### Tests E2E uniquement

```bash
npm test -- --testPathPattern="e2e-spec"
```

### Un fichier spécifique

```bash
npm test -- --testPathPattern="products.service.spec"
```

### Mode watch

```bash
npm run test:watch
```

## Couverture de code

### Générer le rapport

```bash
npm test -- --coverage
```

### Seuil minimum

- Objectif : 80% de couverture
- Actuel : À améliorer progressivement

## Bonnes pratiques

### Tests unitaires

1. **Isoler les dépendances** : Utiliser des mocks pour PrismaService
2. **Nommer clairement** : `devrait [action] quand [condition]`
3. **AAA Pattern** : Arrange, Act, Assert
4. **Un test = une assertion principale**
5. **Tests indépendants** : Chaque test doit pouvoir s'exécuter seul

### Tests E2E

1. **Nettoyer la base** : `beforeEach` pour isoler les tests
2. **Utiliser des données uniques** : Éviter les collisions
3. **Tester les cas d'erreur** : 400, 404, 500
4. **Vérifier les formats** : Structure des réponses
5. **Tests réalistes** : Scénarios proches de l'usage réel

### DTOs

1. **Tester les validations** : Champs requis, types, valeurs
2. **Tester les transformations** : Conversion de types
3. **Tester les cas limites** : null, undefined, valeurs invalides

## Modules testés

### ✅ Tests complets

- **Exception Filter** : 5 tests unitaires
- **Products** : 
  - 19 tests unitaires (service + DTO)
  - 11 tests E2E
- **ListQueryDto** : 6 tests unitaires

### 📋 À tester

- Clients (E2E existants, unitaires à ajouter)
- Invoices (E2E existants, unitaires à ajouter)
- Quotes (E2E existants, unitaires à ajouter)
- PDF Service (tests à créer)
- Email Service (tests à créer)

## Configuration Jest

Le fichier `jest.config.js` configure :
- Environnement de test
- Base de données de test (`test.db`)
- Coverage
- Transformateurs TypeScript

## Base de données de test

Les tests E2E utilisent une base SQLite dédiée :
- Fichier : `prisma/test.db`
- Créée automatiquement avant les tests
- Nettoyée entre les tests

## Debugging

### Mode verbose

```bash
npm test -- --verbose
```

### Un seul test

```bash
npm test -- --testNamePattern="devrait créer un produit"
```

### Breakpoints

Utiliser `debugger;` dans le code et lancer avec `node --inspect-brk`.

## Références

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)

