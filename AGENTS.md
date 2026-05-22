# AGENTS.md — Facturio

Guide pour les agents Cursor travaillant sur ce dépôt.

## Production DanielCraft

| Hôte | Rôle |
|------|------|
| **node12.lan** | Nginx reverse proxy HTTPS (`facturio.danielcraft.fr`, `devis.`, `facture.`) |
| **node10.lan** | Application Facturio (`/opt/facturio`) : NestJS `:3000`, Nginx local `:5173` (frontend `dist`) |

Hostname applicatif : **node10.lan** (pas `raspberry-10` dans les configs).

### Déploiement

- Mises à jour : `scripts/deploy/facturio-update.sh` (cron sur node10).
- Séquence : `git pull` → `npm run migrate:prod` → `grant-facturio-role.sql` → `build:prod` → artefact CI frontend → restart.
- Nginx public : `scripts/deploy/nginx/facturio-reverse-proxy.ssl.conf` sur node12.
- Frontend prod : `VITE_API_URL=/api` dans `frontend/env.prod.example`.

Doc détaillée : `scripts/deploy/README.md`, `docs/deployment/POSTGRESQL_PRODUCTION.md`.

### Diagnostic login / API

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| 502 sur `/api` | Nginx ne joint pas node10 | `proxy_pass` → `node10.lan:3000`, `systemctl status facturio` |
| 500 colonne Prisma | Migration non appliquée | `cd server && npm run migrate:prod` |
| 500 après « Login success » | `permission denied for table UserSession` | `grant-facturio-role.sql` en postgres |
| ERR_NAME_NOT_RESOLVED `your_domain` | Ancien build frontend | Redéployer artefact CI, vider cache navigateur |

```bash
sudo journalctl -u facturio -n 30 --no-pager
```

## Stack

- Monorepo : `server/` (NestJS + Prisma), `frontend/` (React + Vite)
- Dev : SQLite — `prisma/schema.prisma`, `prisma/migrations/`
- Prod : PostgreSQL — `prisma/postgresql/schema.prisma`, `prisma/postgresql/migrations/`
- CI : `.github/workflows/ci.yml` (tests + artefact `frontend-dist-<sha>`)

## Conventions

- Répondre en français si l’utilisateur écrit en français.
- Ne committer que sur demande explicite.
- Changements minimaux ; réutiliser les patterns du module concerné.
