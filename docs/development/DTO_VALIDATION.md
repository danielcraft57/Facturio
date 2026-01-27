# DTOs et Validation

Documentation sur les DTOs (Data Transfer Objects) et la validation dans Facturio.

## Vue d'ensemble

Tous les endpoints de l'API utilisent des DTOs avec validation `class-validator` pour garantir la qualité des données entrantes.

## Structure des DTOs

### Convention de nommage

- `CreateXxxDto` : DTO pour la création
- `UpdateXxxDto` : DTO pour la mise à jour (extends `PartialType(CreateXxxDto)`)
- `ListQueryDto` : DTO pour les listes avec pagination/tri/recherche

### Emplacement

Les DTOs sont placés dans `server/src/{module}/dto/` :

```
server/src/
├── clients/
│   └── dto/
│       ├── create-client.dto.ts
│       └── update-client.dto.ts
├── products/
│   └── dto/
│       ├── create-product.dto.ts
│       └── update-product.dto.ts
└── common/
    └── dto/
        └── list-query.dto.ts
```

## Validation avec class-validator

### Décorateurs disponibles

- `@IsString()` : Chaîne de caractères
- `@IsNotEmpty()` : Non vide (pour les champs requis)
- `@IsEmail()` : Format email valide
- `@IsInt()` : Nombre entier
- `@IsNumber()` : Nombre décimal
- `@IsEnum()` : Valeur d'un enum
- `@IsOptional()` : Champ optionnel
- `@Min()` : Valeur minimale
- `@Max()` : Valeur maximale
- `@Length()` : Longueur de chaîne
- `@ValidateNested()` : Validation d'objets imbriqués
- `@IsArray()` : Tableau

### Exemple : CreateProductDto

```typescript
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
	@IsNotEmpty()
	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	sku?: string | null;

	@IsOptional()
	@IsEnum(ProductKind)
	kind?: ProductKind;

	@IsOptional()
	@Transform(({ value }) => (value === undefined || value === null || value === '' ? null : Number(value)))
	@IsNumber()
	@Min(0)
	unitPrice?: number | null;

	@IsOptional()
	@Transform(({ value }) => (value === undefined || value === null || value === '' ? undefined : parseInt(value, 10)))
	@IsInt()
	defaultTaxRateId?: number | null;
}
```

### Transformation avec class-transformer

Le décorateur `@Transform()` permet de transformer les valeurs avant validation :

```typescript
@Transform(({ value }) => (value === undefined || value === null || value === '' ? null : Number(value)))
@IsNumber()
unitPrice?: number | null;
```

## Pagination avec ListQueryDto

Tous les endpoints de liste utilisent `ListQueryDto` pour la pagination, tri et recherche.

Depuis l’intégration du frontend React, **des alias compatibles avec le web** ont été ajoutés :

- `limit` → alias de `pageSize`
- `sortOrder` → alias de `order`

Cela permet d’accepter aussi bien `?pageSize=20&order=asc` que `?limit=20&sortOrder=asc` côté API.

```typescript
export class ListQueryDto {
	@IsOptional()
	@Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : parseInt(value, 10))
	@IsInt()
	@IsPositive()
	page?: number = 1;

	@IsOptional()
	@Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : parseInt(value, 10))
	@IsInt()
	@Min(1)
	@Max(100)
	pageSize?: number = 20;

	/** Alias côté frontend: limit -> pageSize */
	@IsOptional()
	@Transform(({ value }) => value === undefined || value === null || value === '' ? undefined : parseInt(value, 10))
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	sortBy?: string;

	@IsOptional()
	@IsIn(['asc', 'desc'])
	order?: 'asc' | 'desc' = 'desc';

	/** Alias côté frontend: sortOrder -> order */
	@IsOptional()
	@IsIn(['asc', 'desc'])
	sortOrder?: 'asc' | 'desc';
}
```

### Utilisation dans les contrôleurs

```typescript
@Get()
findAll(@Query() query: ListQueryDto) {
	return this.service.findAll(query);
}
```

### Utilisation dans les services

```typescript
async findAll(query: ListQueryDto) {
	const page = query?.page ?? 1;
	const pageSize = query?.pageSize ?? 20;
	const skip = (page - 1) * pageSize;

	const where = query?.search
		? {
			OR: [
				{ name: { contains: query.search } },
				{ sku: { contains: query.search } }
			]
		}
		: undefined;

	const [items, total] = await this.prisma.$transaction([
		this.prisma.product.findMany({
			skip,
			take: pageSize,
			where,
			orderBy: query?.sortBy
				? { [query.sortBy]: (query.order ?? 'desc') as any }
				: { createdAt: 'desc' }
		}),
		this.prisma.product.count({ where })
	]);

	return {
		items,
		total,
		page,
		pageSize
	};
}
```

## Gestion des erreurs

Les erreurs de validation sont automatiquement interceptées par l'`HttpExceptionFilter` et retournées au format :

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "name should not be empty",
    "unitPrice must be a positive number"
  ],
  "timestamp": "2024-12-20T10:30:00.000Z",
  "path": "/api/products"
}
```

## Modules avec DTOs validés

### ✅ Implémentés
- **Clients** : `CreateClientDto`, `UpdateClientDto`
- **Products** : `CreateProductDto`, `UpdateProductDto`
- **Invoices** : `CreateInvoiceDto`, `UpdateInvoiceDto`
- **Common** : `ListQueryDto`

### 📋 À faire
- **Prospects** : Convertir interfaces en classes avec validation
- **Packs** : Convertir interfaces en classes avec validation
- **Quotes** : Vérifier que les DTOs utilisent class-validator
- **Subscriptions** : Créer des DTOs avec validation

## Tests

Des tests unitaires sont disponibles pour valider le comportement des DTOs :

- `server/src/products/dto/create-product.dto.spec.ts`
- `server/src/common/dto/list-query.dto.spec.ts`

### Exemple de test

```typescript
it('devrait valider un DTO valide', async () => {
	const dto = new CreateProductDto();
	dto.name = 'Test Product';
	dto.unitPrice = 100;

	const errors = await validate(dto);
	expect(errors.length).toBe(0);
});

it('devrait rejeter un nom vide', async () => {
	const dto = new CreateProductDto();
	dto.name = '';

	const errors = await validate(dto);
	expect(errors.length).toBeGreaterThan(0);
	expect(errors[0].property).toBe('name');
});
```

## Bonnes pratiques

1. **Toujours utiliser des DTOs** : Ne jamais accepter `any` ou des objets non typés
2. **Validation stricte** : Utiliser `@IsNotEmpty()` pour les champs requis
3. **Transformation** : Utiliser `@Transform()` pour convertir les types
4. **Messages d'erreur** : Laisser class-validator générer les messages par défaut
5. **Tests** : Écrire des tests pour chaque DTO
6. **Documentation** : Documenter les DTOs avec des commentaires JSDoc

## Références

- [class-validator Documentation](https://github.com/typestack/class-validator)
- [class-transformer Documentation](https://github.com/typestack/class-transformer)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)

