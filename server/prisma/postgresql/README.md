# Prisma PostgreSQL (production)

Historique **séparé** de `prisma/migrations/` (SQLite, développement local).

| Fichier | Usage |
|---------|--------|
| `schema.prisma` | Schéma prod (PostgreSQL) |
| `migrations/` | `prisma migrate deploy` sur le Pi |

## Commandes

Toujours depuis **`server/`**. Utiliser les scripts npm (Prisma 6 du projet).

```bash
cd server

# Déployer (avec baseline auto si P3005)
npm run migrate:setup:prod

# Déployer seulement (historique déjà baseline)
npm run migrate:prod

# Nouvelle migration après modification du schéma
npm run migrate:prod:dev -- --name description_du_changement
```

## Erreur P3005 (base prod déjà remplie sans `_prisma_migrations`)

```bash
cd server
npm run migrate:baseline:prod
npm run migrate:prod
```

Ou une seule commande : `npm run migrate:setup:prod`

Si tout le schéma est déjà appliqué à la main :

```bash
npm run migrate:baseline:prod:all
npm run migrate:prod
```

## Première fois — migration initiale déjà appliquée à la main

```bash
npx prisma migrate resolve --applied 20260522120000_incremental_prod_sync \
  --schema=prisma/postgresql/schema.prisma
npm run migrate:prod
```

## Développement local

SQLite : voir `prisma/MIGRATIONS.md` — `npm run migrate:setup`, `npm run migrate:dev`.

Après changement du modèle, mettre à jour **les deux** schémas (`schema.prisma` et `postgresql/schema.prisma`) et ajouter une migration dans **chaque** dossier `migrations/`.
