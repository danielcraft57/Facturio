# Journaux (logs) — Facturio

## Backend (NestJS + Winston)

Les fichiers sont écrits dans **`server/logs/`** au démarrage de l’API :

| Fichier | Contenu |
|---------|---------|
| `app.log` | Infos et au-dessus (niveau `info`) |
| `error.log` | Erreurs uniquement |

Le dossier est créé automatiquement (`winston.config.ts`). Niveau par défaut : `debug` en dev, `info` en production.

```bash
# Personnaliser le niveau
LOG_LEVEL=debug npm run start:dev
```

## Erreurs `ECONNREFUSED` côté Vite

Message typique :

```text
[vite] http proxy error: /api/billing/usage
AggregateError [ECONNREFUSED]
```

**Cause :** le frontend (port 5173) proxy `/api` vers `http://localhost:3000`, mais le **serveur Nest n’est pas démarré**.

**Solution :**

```bash
cd server
npm run start:dev
```

Vérifier que `http://localhost:3000/api` répond. En dev distant : `VITE_API_PROXY_TARGET=http://votre-host:3000` dans `frontend/.env`.

Le proxy Vite limite les messages répétés (1 avertissement / 15 s) et renvoie une réponse JSON 503 au lieu de faire planter la page.

## Frontend

- Requêtes API : console navigateur en dev (`api.ts` log les appels).
- Pas de fichier log frontend par défaut ; utiliser les DevTools (Network, Console).
