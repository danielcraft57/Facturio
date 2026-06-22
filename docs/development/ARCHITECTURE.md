# Architecture PrestaFacture

Vue d'ensemble de l'architecture du projet PrestaFacture.

## Structure du projet

```
PrestaFacture/
├── server/              # Backend NestJS
│   ├── src/            # Code source TypeScript
│   │   ├── clients/    # Module clients
│   │   ├── invoices/   # Module factures
│   │   ├── quotes/     # Module devis
│   │   ├── products/   # Module produits
│   │   ├── taxes/      # Module TVA
│   │   ├── filings/   # Module déclarations
│   │   ├── subscriptions/ # Module abonnements
│   │   ├── accounting/ # Module comptabilité
│   │   └── prisma/     # Service Prisma
│   └── prisma/         # Schéma et migrations
├── frontend/           # Frontend React
│   ├── src/
│   │   ├── components/ # Composants réutilisables
│   │   ├── modules/    # Modules de l'application
│   │   ├── services/   # Services API
│   │   ├── stores/     # Stores Zustand
│   │   └── theme/      # Configuration thème
│   └── public/         # Assets statiques
└── docs/               # Documentation
```

## Stack technique

### Backend (Server)

- **Framework** : NestJS (Node.js + TypeScript)
- **ORM** : Prisma
- **Base de données** : SQLite (dev) / Postgres (prod)
- **Validation** : class-validator
- **Tests** : Jest + Supertest

### Frontend

- **Framework** : React 19 + TypeScript
- **UI** : Material UI v7
- **Build** : Vite + SWC
- **Routing** : React Router DOM
- **État** : Zustand
- **HTTP Client** : Axios

## Architecture backend

### Modules NestJS

Chaque module suit une structure standard :

```
module/
├── module.module.ts    # Définition du module
├── module.controller.ts # Endpoints REST
├── module.service.ts   # Logique métier
└── dto/                # Data Transfer Objects
```

### Principes

- **Séparation des responsabilités** : Controller → Service → Prisma
- **DTOs** : Validation et transformation des données
- **Services** : Logique métier réutilisable
- **Modules** : Organisation modulaire par domaine

## Architecture frontend

### Organisation par modules

Chaque module métier contient :

```
modules/module/
├── ModulePage.tsx      # Page principale
├── components/         # Composants spécifiques
├── types/              # Types TypeScript
└── hooks/              # Hooks personnalisés
```

### Gestion d'état

- **Zustand stores** : État global par domaine (clients, factures, etc.)
- **Cache intelligent** : TTL, priorité, nettoyage automatique
- **Synchronisation multi-onglets** : BroadcastChannel + localStorage
- **Persistance** : Sauvegarde locale automatique

### Services API

- **Client HTTP centralisé** : Axios avec intercepteurs
- **Retry automatique** : Backoff exponentiel
- **Cache** : Invalidation intelligente
- **Gestion d'erreurs** : Standardisée et centralisée

## Communication Frontend ↔ Backend

### API REST

- **Base URL** : `http://localhost:3000/api`
- **Format** : JSON
- **CORS** : Activé par défaut (dev)

### Proxy de développement

Vite proxy configuré pour rediriger `/api/*` vers le backend NestJS.

## Base de données

### Prisma ORM

- **Schéma** : `server/prisma/schema.prisma`
- **Migrations** : Versionnées dans `prisma/migrations/`
- **Client généré** : Automatiquement via `prisma generate`

### Modèles principaux

- **Client** : Informations clients B2B/B2C
- **Invoice** : Factures avec lignes et paiements
- **Quote** : Devis avec conversion en facture
- **Product** : Catalogue produits/services
- **Tax** : Taux de TVA
- **Filing** : Déclarations TVA
- **Subscription** : Abonnements récurrents
- **Accounting** : Plan comptable, journaux, écritures

## Déploiement

### Développement

- **Backend** : `npm run start:dev` (hot reload)
- **Frontend** : `npm run dev` (Vite dev server)
- **Base de données** : SQLite (fichier local)

### Production

- **Docker** : Images multi-stage optimisées
- **Docker Compose** : Orchestration simple
- **Base de données** : Postgres recommandé
- **Build** : TypeScript compilé vers `dist/`

## Sécurité

### CORS

Configuré pour accepter toutes les origines en dev. À restreindre en production.

### Validation

- **DTOs** : Validation automatique avec class-validator
- **TypeScript** : Typage strict
- **Prisma** : Validation au niveau schéma

## Tests

### Backend

- **Unitaires** : Jest
- **E2E** : Supertest + base de test dédiée
- **Coverage** : Suivi via Codecov

### Frontend

- **Unitaires** : Vitest
- **E2E** : Playwright (à venir)

## Évolutions futures

- Authentification JWT
- Multi-tenant
- Webhooks
- Intégrations externes (Stripe, etc.)
- OSINT et scraping automatisé
- Machine Learning pour prédictions




