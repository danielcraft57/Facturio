# CI/CD - Facturio

Documentation sur l'intégration continue (GitHub Actions).

## Workflows

| Fichier | Déclencheur | Rôle |
|---------|-------------|------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | push/PR sur `main` | Tests + build |
| [`.github/workflows/cd-artifacts.yml`](../../.github/workflows/cd-artifacts.yml) | tags `v*` / manuel | Artefacts de build |
| (CI `frontend` job) | push `main` | Artefact `frontend-dist-<sha>` pour déploiement Pi |

## Job `server-unit`

1. Checkout, Node 20, `npm ci` dans `server/`
2. `npx prisma generate`
3. `npm run test:unit` (hors fichiers `*.e2e-spec.ts`)
4. `npm run build`

## Job `server-e2e`

1. `npm run pretest:e2e` — `prisma db push` sur `prisma/prisma/test.db`
2. `npm run test:e2e` — tests `*.e2e-spec.ts` en série (`--runInBand`)

Inclut notamment `e-invoicing.e2e-spec.ts`.

## Job `frontend`

1. `npm ci` dans `frontend/`
2. `npm run lint`
3. `npm test` — `vitest run` (non interactif)
4. `npm run build`

## Scripts locaux

```bash
# Serveur
cd server
npm run test:unit
npm run pretest:e2e && npm run test:e2e
npm test          # unit + e2e

# Frontend
cd frontend
npm test
```

## Variables CI

```env
NODE_ENV=test
DATABASE_URL=file:./prisma/prisma/test.db
```

## Déploiement frontend (Raspberry / faible RAM)

Le workflow **CI** publie `frontend-dist-<commit-sha>` après chaque push sur `main` (build Vite avec `env.prod.example` → `.env.production`).

Sur le serveur :

```bash
# Token lecture seule (repo + Actions), une seule fois :
echo 'ghp_xxxx' | sudo tee /var/lib/facturio/github-token
sudo chmod 600 /var/lib/facturio/github-token
sudo chown pi:pi /var/lib/facturio/github-token

# Test
/opt/facturio/scripts/deploy/fetch-frontend-dist.sh "$(git -C /opt/facturio rev-parse origin/main)"
```

`facturio-update.sh` utilise `FRONTEND_MODE=github` par défaut. Build local : `FRONTEND_MODE=local`.

## Évolutions prévues

- [ ] Rapport de couverture (Codecov) avec seuil minimal
- [ ] Cache Prisma entre jobs
- [ ] Déploiement staging automatique après merge `main`
