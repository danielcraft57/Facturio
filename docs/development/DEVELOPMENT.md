# Guide de développement - PrestaFacture

Guide pour contribuer au développement de PrestaFacture.

## Démarrage rapide

### Backend

```bash
cd server
npm install
npx prisma migrate dev
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Workflow de développement

### Branches

- `main` : Branche principale (production)
- `feature/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs
- `refactor/*` : Refactorisation

### Commits

Messages de commit en français, style Conventional Commits :

```
feat: ajout de la pagination sur les clients
fix: correction du calcul de TVA pour l'export
refactor: simplification du service factures
```

### Pull Requests

1. Créer une branche depuis `main`
2. Développer la fonctionnalité
3. Tester localement
4. Créer une PR avec description claire
5. Attendre la review

## Structure du code

### Backend (NestJS)

#### Créer un nouveau module

```bash
# Structure recommandée
src/module/
├── module.module.ts
├── module.controller.ts
├── module.service.ts
└── dto/
    ├── create-module.dto.ts
    └── update-module.dto.ts
```

#### Exemple de module

```typescript
// module.service.ts
@Injectable()
export class ModuleService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateModuleDto) {
    return this.prisma.module.create({ data });
  }
}

// module.controller.ts
@Controller('modules')
export class ModuleController {
  constructor(private service: ModuleService) {}

  @Post()
  create(@Body() dto: CreateModuleDto) {
    return this.service.create(dto);
  }
}
```

### Frontend (React)

#### Créer un nouveau module

```
src/modules/module/
├── ModulePage.tsx
├── components/
│   └── ModuleComponent.tsx
├── types/
│   └── module.ts
└── hooks/
    └── useModule.ts
```

#### Exemple de store Zustand

```typescript
interface ModuleState {
  items: Module[];
  loading: boolean;
  fetchItems: () => Promise<void>;
}

export const useModuleStore = create<ModuleState>((set) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    set({ loading: true });
    const items = await moduleService.getAll();
    set({ items, loading: false });
  },
}));
```

## Base de données

### Modifier le schéma Prisma

1. Modifier `server/prisma/schema.prisma`
2. Créer une migration :

```bash
npx prisma migrate dev --name description_changement
```

3. Le client Prisma est régénéré automatiquement

### Exemple d'ajout de modèle

```prisma
model NouveauModele {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Seed de données

Le fichier `server/prisma/seed.ts` contient les données initiales.

Pour ajouter des données :

```typescript
await prisma.tax.create({
  data: {
    name: 'TVA réduite',
    rate: 10,
    country: 'FR',
  },
});
```

## Tests

### Backend

#### Tests unitaires

```bash
npm test
```

#### Tests E2E

```bash
npm run test:e2e
```

Les tests E2E utilisent une base SQLite dédiée (`test.db`).

#### Exemple de test

```typescript
describe('ClientsController', () => {
  it('should create a client', async () => {
    const response = await request(app.getHttpServer())
      .post('/clients')
      .send({ name: 'Test', email: 'test@test.com' })
      .expect(201);

    expect(response.body.name).toBe('Test');
  });
});
```

### Frontend

#### Tests unitaires

```bash
npm test
```

#### Tests E2E (à venir)

```bash
npm run test:e2e
```

## Linting et formatage

### Backend

ESLint configuré. Vérifier avant de commit :

```bash
npm run lint
```

### Frontend

ESLint configuré. Vérifier :

```bash
npm run lint
```

## Bonnes pratiques

### Backend

1. **DTOs** : Toujours utiliser des DTOs pour la validation
2. **Services** : Logique métier dans les services, pas les controllers
3. **Erreurs** : Utiliser les exceptions NestJS appropriées
4. **Types** : TypeScript strict activé
5. **Tests** : Écrire des tests pour les fonctionnalités critiques

### Frontend

1. **Composants** : Composants réutilisables dans `components/`
2. **Hooks** : Logique réutilisable dans des hooks personnalisés
3. **Stores** : État global avec Zustand, état local avec useState
4. **Types** : Types TypeScript pour toutes les données
5. **Performance** : Utiliser React.memo et useMemo quand nécessaire

### Base de données

1. **Migrations** : Toujours créer des migrations pour les changements
2. **Relations** : Définir les relations dans le schéma Prisma
3. **Indexes** : Ajouter des indexes pour les requêtes fréquentes
4. **Seed** : Maintenir le seed à jour avec les nouvelles données

## Débogage

### Backend

Les logs sont affichés dans la console. Pour plus de détails :

```typescript
console.log('Debug:', data);
```

### Frontend

Utiliser les DevTools React et les outils de développement du navigateur.

### Base de données

Visualiser les données avec Prisma Studio :

```bash
npx prisma studio
```

## Déploiement

### Build de production

#### Backend

```bash
npm run build
npm start
```

#### Frontend

```bash
npm run build
```

Les fichiers sont générés dans `dist/` (backend) et `dist/` (frontend).

### Docker

```bash
docker compose up --build
```

## Ressources

- [Documentation NestJS](https://docs.nestjs.com/)
- [Documentation Prisma](https://www.prisma.io/docs/)
- [Documentation React](https://react.dev/)
- [Documentation Material UI](https://mui.com/)
- [Documentation Zustand](https://zustand-demo.pmnd.rs/)

## Questions fréquentes

### Comment ajouter un nouvel endpoint ?

1. Ajouter la méthode dans le service
2. Ajouter la route dans le controller
3. Créer les DTOs si nécessaire
4. Tester avec cURL ou Postman

### Comment ajouter un nouveau champ à un modèle ?

1. Modifier `schema.prisma`
2. Créer une migration
3. Mettre à jour les DTOs
4. Mettre à jour les services et controllers

### Comment gérer les erreurs ?

Utiliser les exceptions NestJS :

```typescript
throw new NotFoundException('Client not found');
throw new BadRequestException('Invalid data');
```

### Comment tester les endpoints ?

Utiliser cURL, Postman, ou les tests E2E.




