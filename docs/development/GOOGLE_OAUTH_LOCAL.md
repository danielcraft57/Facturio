# Google OAuth en local (localhost)

## Symptôme

Connexion Google OK chez Google, puis retour sur PrestaFacture → **session invalide** / redirection vers `/login`.

## Cause fréquente

En dev, le **frontend** tourne sur `http://localhost:5173` (Vite) et l'**API** sur `http://localhost:3000`.

Si `GOOGLE_CALLBACK_URL` pointe vers **:3000**, le cookie `access_token` est posé pour le port 3000.  
Or les appels API passent par **:5173/api** (proxy Vite) → le navigateur **n'envoie pas** ce cookie.

## Configuration correcte

### 1. `server/.env`

```env
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_CALLBACK_URL=http://localhost:5173/api/auth/google/callback
```

- **ID client** : se termine par `.apps.googleusercontent.com` (pas `GOCSPX-…`).
- **Secret** : commence par `GOCSPX-`.

**Piège fréquent :** ne pas laisser **deux blocs** `GOOGLE_CLIENT_ID` dans `server/.env`. Dotenv garde la **dernière** valeur — si un placeholder `your-google-client-id` reste en bas du fichier, Google renvoie `401 invalid_client` (« OAuth client was not found »).

### 2. Google Cloud Console

[APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → client OAuth **Application Web** :

| Champ | Valeur |
|-------|--------|
| Origines JavaScript autorisées | `http://localhost:5173` |
| URI de redirection autorisées | `http://localhost:5173/api/auth/google/callback` |

Écran de consentement OAuth : en mode **Test**, ajoutez votre adresse Gmail dans **Utilisateurs test**.

### 3. Démarrer les deux serveurs

```bash
# Terminal 1
cd server
npm run start:dev

# Terminal 2
cd frontend
npm run dev
```

Puis : `http://localhost:5173/login` → **Continuer avec Google**.

## Secours dev (déjà dans le code)

En `NODE_ENV=dev`, après OAuth le serveur redirige aussi avec `#access_token=…` dans l'URL.  
`AuthBootPage` le lit et le met dans `localStorage` avant le bootstrap.

## Production

`GOOGLE_CALLBACK_URL=https://prestafacture.com/api/auth/google/callback`  
(pas de token dans le hash — cookie HTTPS uniquement).

## Codes beta testeurs

Voir [`BETA_TESTEURS.md`](./BETA_TESTEURS.md) :

```bash
cd server
npm run beta:codes -- create DEV26 --label="Campagne locale"
npm run beta:codes -- stats
```

Lien d'inscription : `http://localhost:5173/signup?beta=DEV26`
