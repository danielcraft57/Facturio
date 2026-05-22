# Migrations Prisma (SQLite + PostgreSQL)

Deux historiques **séparés** :

| Environnement | Schéma | Migrations |
|---------------|--------|------------|
| Dev local | `prisma/schema.prisma` | `prisma/migrations/` (23 fichiers) |
| Production | `prisma/postgresql/schema.prisma` | `prisma/postgresql/migrations/` (4 fichiers) |

Ne plus utiliser `db push` sur une base de dev persistante : préférer **migrate**.

## Dev (SQLite)

```powershell
cd server

# Première fois ou après git pull (recommandé)
npm run migrate:setup

# Nouvelle évolution du schéma
npm run migrate:dev -- --name description_du_changement

# Appliquer sans créer de migration (CI / collègue)
npm run migrate:deploy
```

### Erreur P3005 (`database schema is not empty`)

La base a été créée avec `db push` sans table `_prisma_migrations`.

**Une commande (recommandé)** :

```powershell
npm run migrate:setup
```

Équivalent manuel : marquer tout l’historique comme déjà appliqué, puis `deploy` :

```powershell
npm run migrate:baseline
npm run migrate:deploy
npx prisma generate
```

Si une migration échoue avec « duplicate column » (schéma déjà à jour via `db push`), `migrate:setup` la marque automatiquement comme appliquée et continue.

Détection fine (laisser certaines migrations en attente) :

```powershell
npm run migrate:baseline:auto
npm run migrate:deploy
```

Forcer des migrations à rejouer :

```powershell
node scripts/prisma-baseline.mjs --pending 20260522200000_mailbox_flags_tags
npm run migrate:deploy
```

## Production (PostgreSQL)

```bash
cd server
npm run migrate:setup:prod
```

Première prod déjà alignée manuellement :

```bash
npx prisma migrate resolve --applied 20260522120000_incremental_prod_sync \
  --schema=prisma/postgresql/schema.prisma
npm run migrate:prod
```

Voir aussi `prisma/postgresql/README.md`.

## Nouvelle migration (les deux bases)

1. Modifier `prisma/schema.prisma` **et** `prisma/postgresql/schema.prisma` (ou `schema.postgresql.prisma` si synchronisé).
2. Dev : `npm run migrate:dev -- --name ma_modif`
3. Copier / adapter le SQL pour Postgres dans `prisma/postgresql/migrations/YYYYMMDDHHMMSS_ma_modif/migration.sql` (utiliser `IF NOT EXISTS` côté Postgres si besoin).
4. Prod : `npm run migrate:prod`
