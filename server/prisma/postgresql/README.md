# Prisma PostgreSQL (production)

Historique **séparé** de `prisma/migrations/` (SQLite, développement local).

| Fichier | Usage |
|---------|--------|
| `schema.prisma` | Schéma prod (PostgreSQL) |
| `migrations/` | `prisma migrate deploy` sur le Pi |

## Commandes

```bash
cd server

# Déployer les migrations sur prod (automatique via facturio-update.sh)
npm run migrate:prod

# Créer une nouvelle migration après modification du schéma
npm run migrate:prod:dev -- --name description_du_changement
```

## Première fois sur une base déjà en prod (manuel SQL déjà fait)

Si `migrate deploy` échoue car la migration initiale est déjà appliquée à la main :

```bash
npx prisma migrate resolve --applied 20260522120000_incremental_prod_sync \
  --schema=prisma/postgresql/schema.prisma
```

## Développement local

Reste sur SQLite : `prisma/schema.prisma` + `npx prisma migrate dev` ou `db push`.

Après changement du modèle, mettre à jour **les deux** schémas (`schema.prisma` et `postgresql/schema.prisma`) ou les garder synchronisés.
