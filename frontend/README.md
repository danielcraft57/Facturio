# Frontend Facturio

Ce frontend utilise Vite, React, TypeScript et Material UI. Il inclut un thème personnalisable, un layout AppBar + Drawer et des routes de base.

## Démarrer

1. Installer les dépendances
```
npm install
```

2. Lancer le serveur de dev
```
npm run dev
```

- Frontend: `http://localhost:5173`
- API proxifiée: requêtes `fetch('/api/...')` redirigées vers `http://localhost:3000`

## Personnaliser le thème
Modifiez `src/theme/theme.ts`:
- palette: `primary`, `secondary`
- typography: police, graisses
- shape: `borderRadius`
- bascule clair/sombre dans `localStorage` (`theme-mode`)

## Structure
- `src/modules/app` app et layout
- `src/modules/*` pages (Dashboard, Clients, Devis, Factures, Produits, Taxes, Abonnements, Déclarations, Comptabilité)
