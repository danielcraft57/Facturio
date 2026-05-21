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

## Schéma Prisma

```bash
cd /opt/facturio/server
npm run prisma:prod
npx prisma db push --schema=prisma/schema.postgresql.prisma --accept-data-loss
# ou migrate deploy si l’historique migrations Postgres est aligné
```

## Maintenance après déploiement

```bash
sudo -u postgres psql -d facturio -f /opt/facturio/scripts/deploy/postgresql/maintenance.sql
```

Le script `scripts/deploy/facturio-update.sh` exécute `ANALYZE` après chaque mise à jour.

## Vérifications

```bash
sudo -u postgres psql -d facturio -c "SELECT count(*) FROM pg_stat_activity WHERE datname='facturio';"
sudo -u postgres psql -d facturio -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;"
```

## Checklist sécurité

- [ ] Mot de passe fort dédié `facturio`
- [ ] `SECRETS_ENCRYPTION_KEY` défini (secrets Stripe org chiffrés)
- [ ] `JWT_SECRET` unique (pas la valeur d’exemple)
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_…` (webhook unifié `/api/webhooks/stripe`)
- [ ] PostgreSQL non exposé sur Internet (écoute `127.0.0.1` uniquement)
