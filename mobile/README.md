# Facturio Mobile

Application **React Native (Expo)** pour tablette et smartphone — tableau de bord, factures, connexion à l’API Facturio existante.

Inclut désormais :
- synchro temps réel (SSE) sur devis/factures,
- notifications locales sur engagement client (vu, cliqué, payé, accepté/refusé),
- file d’actions hors-ligne (envoi différé quand internet revient).

## Prérequis

- Node.js ≥ 18
- Backend Facturio en local (`npm run start:dev --prefix server`) ou prod
- Expo Go sur appareil, ou émulateur Android / simulateur iOS

## Démarrage rapide

```bash
cd mobile
cp .env.example .env
# Éditer EXPO_PUBLIC_API_URL (IP LAN pour appareil physique)

npm install
npm start
```

Puis `a` (Android), `i` (iOS), **`w` (Web)** pour itérer sur le design, ou scanner le QR code avec Expo Go.

### Travailler sur le design dans le navigateur

Oui — Expo cible le **web** avec le même code React Native :

```bash
cd mobile
npm run web
# ou : npx expo start --web
```

- Ouvrir l’URL affichée (souvent `http://localhost:8081`)
- Redimensionner la fenêtre : **&lt; 768 px** ≈ mobile, **≥ 768 px** ≈ tablette (sidebar)
- Titre d’onglet dynamique : `Tableau de bord · Facturio`, etc.
- `app/+html.tsx` : meta `theme-color`, description, favicon

Limites du web : `expo-secure-store` utilise AsyncStorage (OK en dev) ; certaines APIs natives (push, biométrie) ne s’y exécutent pas.

### Icônes et splash (marque Facturio)

Source vectorielle : `assets/source/icon.svg` (navy + teal + « F »).

```bash
cd mobile
npm install sharp --save-dev
node scripts/generate-brand-assets.mjs
```

Régénère `icon.png`, `splash-icon.png`, `favicon.png`, `android-icon-foreground.png`.

Métadonnées app : `app.json` (nom **Facturio**, splash `#002D3D`, adaptive icon Android).

## Structure

```
mobile/
├── app/                 # Expo Router (écrans)
├── src/
│   ├── theme/           # Couleurs, espacements
│   ├── components/      # UI réutilisable
│   ├── services/        # API + auth
│   └── hooks/           # Auth, layout responsive
└── docs/
    ├── ROADMAP.md
    ├── AUTH.md
    ├── DESIGN.md
    └── API.md
```

## Documentation

| Fichier | Contenu |
|---------|---------|
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Phases de développement |
| [docs/AUTH.md](./docs/AUTH.md) | Login, JWT, device fingerprint |
| [docs/DESIGN.md](./docs/DESIGN.md) | Charte visuelle (maquettes) |
| [docs/API.md](./docs/API.md) | Endpoints consommés |
| [docs/API_MOBILE_AUDIT.md](./docs/API_MOBILE_AUDIT.md) | Inventaire API réutilisable vs à créer |
| [docs/EXPO_NATIVE_MODULES.md](./docs/EXPO_NATIVE_MODULES.md) | Modules Expo recommandés + LLM |

## Branche Git

Travail initial sur `feature/mobile-react-native`.

## Scripts

| Commande | Description |
|----------|-------------|
| `npm start` | Metro + Expo dev tools |
| `npm run android` | Lance sur Android |
| `npm run ios` | Lance sur iOS (macOS) |
| `npm run web` | Preview web (dev uniquement) |
| `npm test` | Tests unitaires (Jest) |
| `npm run typecheck` | Vérification TypeScript |

## Configuration API

Variable `EXPO_PUBLIC_API_URL` :

| Contexte | URL typique |
|----------|-------------|
| Émulateur Android | `http://10.0.2.2:3000/api` |
| Simulateur iOS | `http://localhost:3000/api` |
| Appareil physique | `http://<IP-LAN>:3000/api` |
| Production | `https://facturio.danielcraft.fr/api` |
