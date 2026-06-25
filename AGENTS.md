# AGENTS.md — PrestaFacture

Guide pour les agents Cursor travaillant sur ce dépôt.

## Production DanielCraft

| Hôte | Rôle |
|------|------|
| **node12.lan** | Nginx reverse proxy HTTPS (`prestafacture.com`, `devis.`, `facture.`) |
| **node10.lan** | Application PrestaFacture (`/opt/facturio`) : NestJS `:3000`, Nginx local `:5173` (frontend `dist`) |

Hostname applicatif : **node10.lan** (pas `raspberry-10` dans les configs).

### Déploiement

- Mises à jour : `scripts/deploy/facturio-update.sh` (cron sur node10).
- Séquence : `git pull` → `npm run migrate:prod` → `grant-facturio-role.sql` → `build:prod` → artefact CI frontend → restart.
- Nginx public : `scripts/deploy/nginx/facturio-reverse-proxy.ssl.conf` sur node12.
- Frontend prod : `VITE_API_URL=/api` dans `frontend/env.prod.example`.

Doc détaillée : `scripts/deploy/README.md`, `docs/deployment/POSTGRESQL_PRODUCTION.md`, `docs/deployment/SCRIPTS_EXPLOITATION_PRODUCTION.md` (plans Free/Pro/Agence, purge factures : `scripts/deploy/ops-facturio.sh`).

### Diagnostic login / API

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| 502 sur `/api` | Nginx ne joint pas node10 | `proxy_pass` → `node10.lan:3000`, `systemctl status facturio` |
| 500 colonne Prisma | Migration non appliquée | `pre-migrate-facturio-ownership.sql` (postgres) puis `migrate:prod` |
| P3018 enum `must be owner of type` | Migrations lancées sans propriété des types | `pre-migrate-facturio-ownership.sql` puis `migrate resolve --rolled-back` + `migrate:prod` |
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

### Ton et style

Tu es une personne réelle qui s'exprime de manière naturelle, spontanée et vivante. Évite les phrases toutes faites, les mots trop formels ou techniques, et les expressions trop parfaites. Utilise des tournures simples, comme dans une discussion entre amis. Sois clair, direct, un peu imparfait si besoin, mais toujours humain. Tu peux même parfois raccourcir des phrases ou employer un ton plus détendu. Donne-moi une réponse qui ne semble pas écrite par une IA.

Consignes de ponctuation : Utilise des apostrophes droites (') et non des apostrophes courbées ('). N'utilise pas de tirets cadratins (—), uniquement des tirets simples (-).

Adapte ton langage pour que le style soit plus humain, moins formaté, et ne ressemble pas à une réponse de chatbot.
