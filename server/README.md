# Facturio - Server
[![CI](https://github.com/loupix/Facturio/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/loupix/Facturio/actions/workflows/ci.yml) [![Coverage](https://img.shields.io/codecov/c/github/loupix/Facturio?token=&branch=main)](https://app.codecov.io/gh/loupix/Facturio) [![Node](https://img.shields.io/badge/node-18.x-339933?logo=nodedotjs&logoColor=white)](https://github.com/loupix/Facturio/actions/workflows/ci.yml)

API backend pour la gestion de clients, devis, factures, taxes et dépôts (TVA).

## Stack
- Node.js + TypeScript
- NestJS
- Prisma ORM
- SQLite (dev par défaut) / Postgres (recommandé en prod)

## Prérequis
- Node 18+ et npm

## Quick start
```bash
npm install
npx prisma migrate dev
# Base dev rapide (SQLite)
npx prisma db push
# Seed de données (optionnel)
npm run seed:dev
npm run start:dev
```
API sur `http://localhost:3000`.

## Variables d'environnement
Créer un fichier `.env` à la racine de `server/` si besoin:
```bash
# Dev (SQLite par défaut via schema.prisma)
# Pour Postgres:
# DATABASE_URL="postgresql://user:password@host:5432/factuflow?schema=public"
PORT=3000
NODE_ENV=development
# Seed
# SEED_PURGE=false
```

## Lancer en développement
```bash
npm run start:dev
```
Lance NestJS avec rechargement à chaud. CORS activé par défaut (origine libre, credentials true).

## Build et production
```bash
npm run build
npm start
```
Le build génère `dist/` et `npm start` exécute `dist/main.js`.

## Docker
### Lancer en local (SQLite)
```bash
docker compose up --build
```
API disponible sur `http://localhost:3000`.

### Variables utiles
- `DATABASE_URL`: par défaut `file:./prisma/dev.db` (SQLite). Pour Postgres, mettez une URL Postgres.

### Image manuelle
```bash
cd server
docker build -t facturio-server:latest .
docker run --rm -p 3000:3000 -e DATABASE_URL=file:./prisma/dev.db facturio-server:latest
```

L'entrypoint applique `prisma db push` au démarrage si `DATABASE_URL` est défini.

## Base de données (Prisma)
- Schéma: `prisma/schema.prisma`
- Dev par défaut: SQLite (fichier `prisma/dev.db`)

Commandes utiles:
```bash
# Appliquer le schéma (dev) et générer le client
npx prisma migrate dev

# Synchroniser sans migration (dev rapide)
npx prisma db push

# Studio (visualisation)
npx prisma studio

# Seed (si présent)
npm run seed
# Seed de dev (pousse le schéma et injecte sans purge)
npm run seed:dev
```

### Passer à Postgres (prod)
1. Créer un `.env` à la racine de `server/`:
```bash
DATABASE_URL="postgresql://user:password@host:5432/factuflow?schema=public"
```
2. Mettre à jour le provider dans `prisma/schema.prisma` si besoin.
3. Lancer:
```bash
npx prisma migrate deploy
```

## Endpoints (aperçu)
Chaque module expose des routes REST classiques (`GET/POST/PATCH/DELETE`).

### Clients
- POST `/clients`
- GET `/clients`
- GET `/clients/:id`
- PATCH `/clients/:id`
- DELETE `/clients/:id`

Exemple création client:
```bash
curl -X POST http://localhost:3000/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"ACME","email":"contact@acme.test"}'
```

### Invoices
- POST `/invoices`
- GET `/invoices`
- GET `/invoices/:id`
- PATCH `/invoices/:id`
- DELETE `/invoices/:id`
- GET `/invoices/:id/payments`
- POST `/invoices/:id/payments`

Exemple création facture minimale:
```bash
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "lines": [
      {"description":"Prestation","quantity":2,"unitPrice":150}
    ]
  }'
```

### Quotes
- POST `/quotes`
- GET `/quotes`
- GET `/quotes/:id`
- PATCH `/quotes/:id`
- DELETE `/quotes/:id`
- POST `/quotes/:id/convert-to-invoice`

### Products
- POST `/products`
- GET `/products`
- GET `/products/:id`
- PATCH `/products/:id`
- DELETE `/products/:id`

### Subscriptions & Plans
- POST `/subscriptions/plans`
- GET `/subscriptions/plans`
- GET `/subscriptions/plans/:id`
- PATCH `/subscriptions/plans/:id`
- DELETE `/subscriptions/plans/:id`
- POST `/subscriptions`
- GET `/subscriptions`
- GET `/subscriptions/:id`
- PATCH `/subscriptions/:id`
- POST `/subscriptions/:id/cancel-at-period-end`
- POST `/subscriptions/:id/cancel-now`

### Taxes (TVA)
- POST `/taxes`
- GET `/taxes`
- GET `/taxes/:id`
- PATCH `/taxes/:id`
- DELETE `/taxes/:id`

### Filings (déclarations)
- POST `/filings`
- GET `/filings`
- GET `/filings/:id`
- PATCH `/filings/:id`
- POST `/filings/:id/calculate` (CA3/CA12 simplifiée)
- POST `/filings/:id/payments`

## Règles TVA (simplifiées v1)
- FR: 20% par défaut (taux par défaut modifiable via `/taxes`).
- UE B2B avec `vatNumber`: 0% avec mention d'autoliquidation.
- Hors UE: 0% (export).
- Exonération client: 0%.
- On peut surcharger le taux au niveau client (`taxRateOverrideId`).

## Structure
```
src/
  app.module.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  clients/
  products/
  quotes/
  invoices/
  taxes/
  filings/
  subscriptions/
prisma/
  schema.prisma
  migrations/
  dev.db
```

## Scripts npm
- `start:dev`: démarre l’API en mode dev
- `build`: compile TypeScript vers `dist/`
- `start`: démarre l’API compilée
- `seed`: exécute `prisma/seed.ts`
- `seed:dev`: pousse le schéma sur `dev.db` puis seed
- `test`: lance tous les tests
- `test:e2e`: lance les tests e2e sur base SQLite dédiée

## Tests
```bash
# Unitaire + e2e combinés
npm test
# e2e uniquement
npm run test:e2e
```

## Workflows dev
- Branches features courtes, `npx prisma migrate dev` si le schéma évolue.
- Tests e2e à prévoir sur devis/factures et taxes.
- Logs lisibles en dev, variables en `.env`.

## Lien avec la roadmap
Voir `server/ROADMAP.md` pour l’ordre des priorités (PDF, envoi email, suivi vues/acceptation, auth, import/export...).

## Qualité et outillage
- Typage strict TypeScript
- Prisma Client généré automatiquement
- Possibilité d’ajouter tests e2e (Jest + Supertest)

## Notes
- En dev, SQLite est pratique et sans config. Pour la prod, utilisez Postgres.
- Pensez aux montants en décimal (pas de float) côté base et calculs.
 - La route Filings de calcul est `POST /filings/:id/calculate` (statuts renvoyés en minuscules dans les réponses publiques).
