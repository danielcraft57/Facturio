# PostgreSQL — production Facturio

## Création base et utilisateur

```bash
# Éditer le mot de passe dans le script puis :
sudo -u postgres psql -f /opt/facturio/scripts/deploy/postgresql/init-facturio.sql
```

`pg_hba.conf` (accès local uniquement) :

```
host    facturio    facturio    127.0.0.1/32    scram-sha-256
```

```bash
sudo systemctl restart postgresql
```

## Tuning serveur (2 Go RAM)

```bash
sudo cp /opt/facturio/scripts/deploy/postgresql/facturio-tuning.conf \
  /etc/postgresql/16/main/conf.d/99-facturio.conf
sudo systemctl restart postgresql
```

## `DATABASE_URL` (serveur)

Dans `server/.env` (copié depuis `env.prod.example`) :

```env
DATABASE_URL="postgresql://facturio:MOT_DE_PASSE@127.0.0.1:5432/facturio?schema=public"
SECRETS_ENCRYPTION_KEY=<64 caractères hex>
```

L’API ajoute automatiquement `connection_limit`, `pool_timeout`, `connect_timeout` et `application_name` au démarrage si absents.

## Schéma Prisma (migrations PostgreSQL)

Historique dédié : `server/prisma/postgresql/migrations/` (≠ `prisma/migrations/` SQLite en dev).

```bash
cd /opt/facturio/server
npm run migrate:prod
npm run build:prod
```

`facturio-update.sh` exécute automatiquement **`migrate:prod`** puis **`grant-facturio-role.sql`** (droits sur tables créées par `postgres`).

Nouvelle migration en dev :

```bash
cd server
npm run migrate:prod:dev -- --name description_du_changement
```

Voir `server/prisma/postgresql/README.md`.

### Droits applicatif (`facturio`)

Si les logs indiquent `permission denied for table UserSession` (ou autre table récente) :

```bash
sudo -u postgres psql -d facturio -f /opt/facturio/scripts/deploy/postgresql/grant-facturio-role.sql
sudo systemctl restart facturio
```

## Maintenance après déploiement

```bash
sudo -u postgres psql -d facturio -f /opt/facturio/scripts/deploy/postgresql/maintenance.sql
```

Le script `facturio-update.sh` exécute `ANALYZE` après chaque mise à jour.

## Migration en échec (P3009)

Si `migrate deploy` s’arrête avec **P3009** et une migration `failed` (ex. `20260525120000_entity_cuid_ids`) :

```bash
cd /opt/facturio/server

# État des migrations
sudo -u postgres psql -d facturio -c \
  "SELECT migration_name, finished_at, rolled_back_at, logs FROM \"_prisma_migrations\" ORDER BY started_at DESC LIMIT 5;"

# Marquer l’échec comme annulé (après pull du correctif SQL), puis redéployer
npx prisma migrate resolve --rolled-back 20260525120000_entity_cuid_ids \
  --schema=prisma/postgresql/schema.prisma
sudo -u pi bash /usr/local/bin/facturio-update.sh

# Ou uniquement migrate (si `facturio-update.sh` est à jour, il fait le resolve automatiquement) :
# npm run migrate:prod
sudo -u postgres psql -d facturio -f /opt/facturio/scripts/deploy/postgresql/grant-facturio-role.sql
sudo systemctl restart facturio
```

La migration CUID supprime clients / factures / devis liés avant conversion des IDs en `TEXT` (réimport seed si besoin).

## Vérifications

```bash
sudo -u postgres psql -d facturio -c "SELECT count(*) FROM pg_stat_activity WHERE datname='facturio';"
sudo -u postgres psql -d facturio -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;"
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" -d '{"email":"vous@example.com","password":"…"}'
```

## Checklist sécurité

- [ ] Mot de passe fort dédié `facturio`
- [ ] `SECRETS_ENCRYPTION_KEY` défini (secrets Stripe org chiffrés)
- [ ] `JWT_SECRET` unique (pas la valeur d’exemple)
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_…` (webhook unifié `/api/webhooks/stripe`)
- [ ] PostgreSQL non exposé sur Internet (écoute `127.0.0.1` uniquement)
