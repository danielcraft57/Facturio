## PrestaFacture - Frontend

Application de gestion commerciale moderne avec interface React et Material UI.

## État actuel

### ✅ Fonctionnalités implémentées

#### **Architecture & Fondations**
- ✅ Projet Vite + React + TypeScript
- ✅ Material UI v7 avec thème personnalisable
- ✅ Layout responsive avec navigation (AppBar + Drawer burger)
- ✅ Routing avec React Router DOM
- ✅ Proxy vers backend NestJS

#### **Services API**
- ✅ Client HTTP avec intercepteurs (auth, retry, cache)
- ✅ Normalisation des réponses (`{ success, data }`) pour les appels NestJS
- ✅ Gestion d'erreurs standardisée
- ✅ Cache intelligent avec invalidation automatique
- ✅ Retry automatique avec backoff exponentiel
- ✅ Services spécialisés : clients, factures, produits, packs, prospects, taxes, comptabilité, abonnements, déclarations

#### **Composants de base**
- ✅ DataTable réutilisable avec pagination, tri, filtres
- ✅ ConfirmDialog avec variantes spécialisées
- ✅ Système de notifications toast global
- ✅ Thème personnalisable (couleurs, densité, arrondis)
- ✅ Loader de page moderne (transition entre routes)

#### **Pages & Navigation**
- ✅ Dashboard avec statistiques, graphiques et filtres par période
- ✅ Clients : liste avec recherche/filtres + fiche client détaillée
- ✅ Factures : liste, création (dialog), fiche facture avec paiements partiels et historique
- ✅ Devis : liste, workflow d'envoi/acceptation/rejet, conversion backend vers facture
- ✅ Produits : catalogue produits avec filtres et panneau de détails
- ✅ Packs : templates prédéfinis (bundles) avec calculs automatiques
- ✅ Prospects : module CRM léger (pipeline, scoring, analytics)
- ✅ Taxes, abonnements, déclarations : pages dédiées
- ✅ Comptabilité : plan comptable, balance et grand livre (lecture seule)

## Technologies

- **Frontend** : React 19 + TypeScript
- **UI** : Material UI v7
- **Build** : Vite + SWC
- **Routing** : React Router DOM
- **HTTP Client** : Axios avec intercepteurs
- **État** : Zustand + React Hooks (stores spécialisés) + persistance locale

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev

# Build de production
npm run build
```

## Personnalisation

### Thème
- Mode clair/sombre
- Couleurs primaires et secondaires personnalisables
- Densité (confort/compact)
- Arrondis configurables

### Navigation
- Drawer burger responsive
- Navigation par sections
- Paramètres intégrés

## Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── DataTable.tsx   # Tableau de données avec pagination
│   ├── ConfirmDialog.tsx # Modales de confirmation
│   └── Toast.tsx       # Système de notifications
├── modules/            # Modules de l'application
│   ├── app/           # Layout et configuration
│   ├── dashboard/     # Dashboard principal avec graphiques
│   ├── clients/       # Gestion des clients
│   ├── invoices/      # Gestion des factures
│   ├── products/      # Gestion des produits et packs
│   └── ...           # Autres modules
├── services/          # Services API
│   ├── api.ts        # Client HTTP principal
│   ├── clients.ts    # Service clients
│   ├── invoices.ts   # Service factures
│   ├── products.ts   # Service produits
│   └── packService.ts # Service packs
├── theme/            # Configuration du thème
└── data/             # Données de démonstration
```

## Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine de `frontend/`:

```env
# URL de l'API NestJS
VITE_API_URL=http://localhost:3000/api

# Utiliser les mocks frontend au lieu du backend NestJS
# false par défaut - mettre explicitement à true pour forcer le mode démo
VITE_USE_MOCK=false
```

#### Comment ça marche

- `VITE_API_URL` est utilisée par le client HTTP (`services/api.ts`) comme `baseURL`.
- `VITE_USE_MOCK` contrôle l'utilisation des mocks:
  - `false` (valeur par défaut): tous les services parlent au vrai serveur Nest (`/clients`, `/invoices`, `/accounting`, `/filings`, `/subscriptions`, `/dashboard`...).
  - `true`: certains endpoints passent par `mockApi` et les données de `data/demo.ts` pour un mode démo sans backend.

Assure-toi que le backend est démarré sur `http://localhost:3000` (voir `server/README.md`) ou adapte `VITE_API_URL`.

### Proxy de développement

Le proxy Vite est configuré pour rediriger `/api/*` vers le backend NestJS (voir `vite.config.ts`).

## Développement

### Scripts disponibles
- `npm run dev` - Serveur de développement
- `npm run build` - Build de production (mode production)
- `npm run preview` - Prévisualisation du build
- `npm run lint` - Lint TypeScript/React
- `npm run test` - Tests unitaires (Vitest)
- `npm run test:watch` - Tests en mode watch
- `npm run test:ui` - UI des tests Vitest

Au niveau racine du projet :

- `npm run start:all` - Démarre backend + frontend en mode dev
- `npm run start:all:prod` - Démarre backend (prod) + frontend (preview)
- `npm run build:all` - Build backend + frontend

### Fonctionnalités de développement
- Hot reload automatique
- TypeScript strict
- ESLint configuré
- Proxy API automatique

## Données de démonstration

L'application inclut des données de démonstration réalistes pour :
- Clients avec informations complètes
- Factures avec différents statuts
- Statistiques de dashboard
- Produits et services (modules web/SaaS)
- Packs avec templates prédéfinis (Sites Web, E-commerce, SaaS)

## Prochaines étapes

Voir le fichier `ROADMAP.md` pour le planning détaillé des prochaines fonctionnalités.
Pour les effets visuels premium web (animations, micro-interactions, fluidité), voir `UX_WOW_ROADMAP.md`.

## Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT.
