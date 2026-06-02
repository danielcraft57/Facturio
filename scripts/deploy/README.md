# Scripts de déploiement Facturio

## Architecture production (DanielCraft)

| Hôte | Rôle |
|------|------|
| **node12.lan** | Nginx public — `https://facturio.danielcraft.fr` |
| **node10.lan** | App — `/opt/facturio`, API `:3000`, Nginx local `:5173` (`frontend/dist`) |

## Mise à jour automatique (node10)

```bash
sudo ln -sf /opt/facturio/scripts/deploy/facturio-update.sh /usr/local/bin/facturio-update.sh
chmod +x /opt/facturio/scripts/deploy/facturio-update.sh

# Token GitHub (lecture Actions) pour l’artefact frontend CI
echo 'ghp_…' | sudo tee /var/lib/facturio/github-token
sudo chmod 600 /var/lib/facturio/github-token
sudo chown pi:pi /var/lib/facturio/github-token
```

Cron exemple : `0 4 * * * /usr/local/bin/facturio-update.sh >> /var/log/facturio-update.log 2>&1`

Le script enchaîne : `git pull` → `pre-migrate-facturio-ownership.sql` (postgres) → `npm run migrate:prod` → `grant-facturio-role.sql` → build backend → téléchargement `frontend-dist-<sha>` → restart `facturio`.

## Nginx (node12)

Référence SSL : `nginx/facturio-reverse-proxy.ssl.conf`

```bash
# Depuis votre PC
./scripts/linux/deploy-nginx-config.sh
# ou deploy-nginx-config.ps1 (défauts node10 + node12 + danielcraft.fr)
```

## PostgreSQL

- Init : `postgresql/init-facturio.sql`
- Migrations : `server/prisma/postgresql/` — voir `server/prisma/postgresql/README.md`
- Droits app : `postgresql/grant-facturio-role.sql` (appelé par `facturio-update`)

## Fichiers utiles

| Script | Usage |
|--------|--------|
| `facturio-update.sh` | Mise à jour complète node10 |
| `ops-facturio.sh` | Plans SaaS (free/pro/agency) et purge factures — voir [SCRIPTS_EXPLOITATION_PRODUCTION.md](../../docs/deployment/SCRIPTS_EXPLOITATION_PRODUCTION.md) |
| `fetch-frontend-dist.sh` | Artefact CI uniquement |
| `facturio-frontend-nginx-app.conf` | Nginx statique sur node10 (port 5173) |
| `linux/deploy-nginx-config.sh` | Publier la config sur node12 |

## Dépannage login

1. **502** : Nginx node12 → vérifier `proxy_pass` vers `node10.lan:3000`, backend `active`.
2. **500** après « Login success » : `permission denied for table UserSession` → exécuter `grant-facturio-role.sql` en tant que `postgres`.
3. **500** colonne manquante (`documentTagLibrary`, etc.) : `pre-migrate-facturio-ownership.sql` puis `npm run migrate:prod`.
4. **P3018** `must be owner of type` (enum) : idem — propriété des types avant `migrate:prod` (voir `POSTGRESQL_PRODUCTION.md`).

```bash
sudo journalctl -u facturio -n 30 --no-pager
```
