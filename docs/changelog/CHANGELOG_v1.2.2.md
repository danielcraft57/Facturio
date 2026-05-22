# Changelog v1.2.2 — Production DanielCraft (mai 2026)

## Déploiement & infrastructure

- Architecture documentée : **node12.lan** (Nginx HTTPS) → **node10.lan** (API `:3000`, frontend `:5173`).
- Nginx : config SSL de référence `scripts/deploy/nginx/facturio-reverse-proxy.ssl.conf`.
- Frontend prod : `VITE_API_URL=/api` (plus de domaine `your_domain` dans le bundle).
- `facturio-update.sh` : artefact CI frontend, `prisma migrate deploy`, `GRANT` rôle PostgreSQL, migrate même si SHA déjà déployé.

## Base de données (PostgreSQL)

- Historique Prisma dédié : `server/prisma/postgresql/migrations/` (séparé du SQLite dev).
- Migration initiale idempotente `20260522120000_incremental_prod_sync`.
- Script `grant-facturio-role.sql` après chaque migrate (tables créées par `postgres`).

## Correctifs

- Backend prod : écoute `0.0.0.0:3000` (accessible depuis node12).
- Login : colonnes GDPR / 2FA / `UserSession` + droits `facturio` sur nouvelles tables.
- Build Stripe : types `@stripe/stripe-js` v9.
- Déploiement : permissions `dist.old` / propriétaire `pi` sur le frontend.

## Documentation

- `docs/deployment/POSTGRESQL_PRODUCTION.md`, `scripts/deploy/README.md`, `AGENTS.md` mis à jour.
- Suppression du script SQL manuel `sync-prod-schema.sql` (remplacé par migrations Prisma).
