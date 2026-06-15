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

`facturio-update.sh` exécute **`pre-migrate-facturio-ownership.sql`** (postgres : propriété enums/tables + `documentTagLibrary` si absent), puis **`migrate:prod`**, puis **`grant-facturio-role.sql`**.

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

## Migration en échec (P3018 — enum / propriétaire)

Si `migrate deploy` échoue avec **`must be owner of type "EInvoiceStatus"`** (code `42501`) :

```bash
cd /opt/facturio
git pull origin main

# 1) Propriété des enums/tables pour le rôle facturio + colonne login si besoin
sudo -u postgres psql -d facturio -f scripts/deploy/postgresql/pre-migrate-facturio-ownership.sql

cd server
# 2) Débloquer la migration marquée failed (ex. fix_einvoice_status_enum)
npx prisma migrate resolve --rolled-back 20260528050000_fix_einvoice_status_enum \
  --schema=prisma/postgresql/schema.prisma

# 3) Relancer les migrations
npm run migrate:prod

sudo -u postgres psql -d facturio -f /opt/facturio/scripts/deploy/postgresql/grant-facturio-role.sql
sudo systemctl restart facturio
```

Ou relancer tout le script : `sudo -u pi bash /usr/local/bin/facturio-update.sh` (après `git pull` contenant les scripts ci-dessus).

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

Si l’erreur mentionne `incompatible types: integer and text` sur `Invoice_clientId_fkey`, faire un `git pull` (correctif : FK supprimées avant `ALTER TYPE`), puis `resolve --rolled-back` et relancer `facturio-update`.

### Enum `ADD VALUE` + `UPDATE` (55P04 / P3018)

PostgreSQL refuse d’utiliser une valeur enum **nouvellement ajoutée** dans la **même transaction** que `ALTER TYPE … ADD VALUE` (`unsafe use of new value "SCHEDULED"`).

Les migrations concernées sont scindées (ex. `20260612200000` = ADD VALUE seul, `20260612200001` = backfill UPDATE).

**Déblocage manuel** si une ancienne migration combinée a échoué en prod :

```bash
cd /opt/facturio/server

npx prisma migrate resolve --rolled-back 20260612200000_installment_scheduled_status \
  --schema=prisma/postgresql/schema.prisma

sudo -u postgres psql -d facturio -c \
  "ALTER TYPE \"InvoiceInstallmentStatus\" ADD VALUE IF NOT EXISTS 'SCHEDULED' BEFORE 'PENDING';"

sudo -u postgres psql -d facturio -c "
UPDATE \"InvoiceInstallment\" AS inst
SET status = 'SCHEDULED'
WHERE inst.status = 'PENDING'
  AND inst.sequence > (
    SELECT COALESCE(MIN(ii.sequence), 1)
    FROM \"InvoiceInstallment\" ii
    WHERE ii.\"invoiceId\" = inst.\"invoiceId\"
      AND ii.status = 'PENDING'
  );"

npx prisma migrate resolve --applied 20260612200000_installment_scheduled_status \
  --schema=prisma/postgresql/schema.prisma
npx prisma migrate resolve --applied 20260612200001_installment_scheduled_backfill \
  --schema=prisma/postgresql/schema.prisma

npm run migrate:prod
sudo -u postgres psql -d facturio -f /opt/facturio/scripts/deploy/postgresql/grant-facturio-role.sql
sudo systemctl restart facturio
```

Après `git pull` contenant le correctif, préférer `resolve --rolled-back` puis `npm run migrate:prod` (sans SQL manuel si la base n’a pas encore `SCHEDULED`).

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
