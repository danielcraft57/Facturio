# AGENTS.md — Facturio

Guide pour les agents Cursor travaillant sur ce dépôt.

## Production DanielCraft

| Hôte | Rôle |
|------|------|
| **node12.lan** | Nginx reverse proxy HTTPS (`facturio.danielcraft.fr`, `devis.`, `facture.`) |
| **node10.lan** | Application Facturio (`/opt/facturio`) : NestJS `:3000`, Nginx local `:5173` (frontend `dist`) |

Ne pas utiliser `raspberry-10` — le hostname applicatif est **node10.lan**.

### Déploiement

- Mises à jour auto sur node10 : `facturio-update.sh` (cron) exécute **`npm run migrate:prod`** (`prisma/postgresql/migrations/`) puis build + artefact frontend CI.
- Schéma prod : `server/prisma/postgresql/schema.prisma` (≠ `prisma/migrations/` SQLite dev).
- Config Nginx public : `node12.lan` → `node10.lan` (`scripts/deploy/nginx/facturio-reverse-proxy.ssl.conf`).
- Frontend prod : `VITE_API_URL=/api`.

### Diagnostic login / API

1. Front : requêtes vers `https://facturio.danielcraft.fr/api/...`
2. 502 : Nginx node12 ne joint pas node10:3000 → `proxy_pass` vers `node10.lan`, backend en écoute `0.0.0.0:3000`
3. Sur node10 : `sudo systemctl status facturio`, `curl http://127.0.0.1:3000/api/auth/login`

## Stack

- Monorepo : `server/` (NestJS + Prisma), `frontend/` (React + Vite)
- Branche principale : `main`
- CI : `.github/workflows/ci.yml` (tests + artefact `frontend-dist-<sha>`)

## Conventions

- Répondre en français si l’utilisateur écrit en français.
- Ne committer que sur demande explicite.
- Changements minimaux, réutiliser les patterns existants du module concerné.
