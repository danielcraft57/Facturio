# Facturio - Frontend

Application de gestion commerciale moderne avec interface React et Material UI.

## 🚀 État actuel

### ✅ Fonctionnalités implémentées

#### **Architecture & Fondations**
- ✅ Projet Vite + React + TypeScript
- ✅ Material UI v7 avec thème personnalisable
- ✅ Layout responsive avec navigation (AppBar + Drawer burger)
- ✅ Routing avec React Router DOM
- ✅ Proxy vers backend NestJS

#### **Services API**
- ✅ Client HTTP avec intercepteurs (auth, retry, cache)
- ✅ Gestion d'erreurs standardisée
- ✅ Cache intelligent avec invalidation automatique
- ✅ Retry automatique avec backoff exponentiel
- ✅ Services spécialisés : clients et factures

#### **Composants de base**
- ✅ DataTable réutilisable avec pagination, tri, filtres
- ✅ ConfirmDialog avec variantes spécialisées
- ✅ Système de notifications toast global
- ✅ Thème personnalisable (couleurs, densité, arrondis)

#### **Pages & Navigation**
- ✅ Dashboard avec statistiques et données de démonstration
- ✅ Page clients avec tableau et actions
- ✅ Page produits avec gestion des modules web/SaaS
- ✅ Page packs avec templates prédéfinis et gestion avancée
- ✅ Pages vides pour toutes les sections (devis, factures, etc.)

## 🛠️ Technologies

- **Frontend** : React 19 + TypeScript
- **UI** : Material UI v7
- **Build** : Vite + SWC
- **Routing** : React Router DOM
- **HTTP Client** : Axios avec intercepteurs
- **État** : React Hooks + localStorage

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev

# Build de production
npm run build
```

## 🎨 Personnalisation

### Thème
- Mode clair/sombre
- Couleurs primaires et secondaires personnalisables
- Densité (confort/compact)
- Arrondis configurables

### Navigation
- Drawer burger responsive
- Navigation par sections
- Paramètres intégrés

## 📁 Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── DataTable.tsx   # Tableau de données avec pagination
│   ├── ConfirmDialog.tsx # Modales de confirmation
│   └── Toast.tsx       # Système de notifications
├── modules/            # Modules de l'application
│   ├── app/           # Layout et configuration
│   ├── dashboard/     # Dashboard principal
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

## 🔧 Configuration

### Variables d'environnement
```env
VITE_API_URL=http://localhost:3000/api
```

### Proxy de développement
Le proxy est configuré pour rediriger `/api/*` vers le backend NestJS.

## 🚀 Développement

### Scripts disponibles
- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Prévisualisation du build

### Fonctionnalités de développement
- Hot reload automatique
- TypeScript strict
- ESLint configuré
- Proxy API automatique

## 📊 Données de démonstration

L'application inclut des données de démonstration réalistes pour :
- Clients avec informations complètes
- Factures avec différents statuts
- Statistiques de dashboard
- Produits et services (modules web/SaaS)
- Packs avec templates prédéfinis (Sites Web, E-commerce, SaaS)

## 🎯 Prochaines étapes

Voir le fichier `ROADMAP.md` pour le planning détaillé des prochaines fonctionnalités.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
